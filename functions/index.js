// Modified Firebase Function to handle callable functions properly
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const Stripe = require("stripe");
const crypto = require("crypto");
const Sentry = require("@sentry/node");
const https = require("https");

// Security recommendation: Validate environment in local emulator
if (process.env.FUNCTIONS_EMULATOR === "true") {
  require("dotenv").config();
  console.log("Running in local emulator mode");

  // Validate required environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("⚠️  Missing STRIPE_SECRET_KEY — payment endpoints will be unavailable");
  }
}

// Configuration
const CONFIG = {
  region: "us-central1",
  timeoutSeconds: 60,
  memory: "1GiB",
  minInstances: 0,
  maxInstances: 10,
};

// Initialize Firebase Admin with your config
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://bg-jojo.firebaseio.com",
  projectId: process.env.GCLOUD_PROJECT || "bg-jojo",
});

// Initialize Sentry error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.K_SERVICE ? "production" : "development",
  tracesSampleRate: 0.1,
});

/**
 * Sends an error notification embed to a Discord webhook.
 * Set DISCORD_WEBHOOK_URL in your Firebase Function environment variables.
 * @param title
 * @param description
 * @param fields
 * @param color
 */
const notifyDiscord = (title, description, fields = [], color = 15158332) => {
  return new Promise(resolve => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return resolve();
    try {
      const url = new URL(webhookUrl);
      const body = JSON.stringify({
        embeds: [{
          title,
          description,
          color,
          fields,
          timestamp: new Date().toISOString(),
          footer: { text: "Give Back Jojo — Error Monitor" },
        }],
      });
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      };
      const req = https.request(options, res => {
        res.resume(); resolve();
      });
      req.on("error", err => {
        console.error("Discord notification failed:", err.message);
        resolve();
      });
      req.write(body);
      req.end();
    } catch (err) {
      console.error("Discord notification error:", err.message);
      resolve();
    }
  });
};

// Stripe initialization
let stripe;

/**
 * Initializes and returns a Stripe instance with the configured secret key
 * @returns {Stripe|null} Initialized Stripe instance or null if initialization fails
 * @throws {Error} If Stripe secret key is not configured
 */
const initializeStripe = () => {
  try {
    // IMPORTANT: Use process.env directly - don't use functions.config()
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured in environment variables");
    }

    const isTestKey = process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");
    if (isTestKey && process.env.K_SERVICE) {
      console.warn("⚠️  Stripe is running in TEST MODE in production. Switch to live keys before accepting real payments.");
    }

    return new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-04-10",
      typescript: true,
      timeout: 10000, // 10 second timeout
    });
  } catch (error) {
    console.error("❌ Stripe initialization failed:", error.message);
    return null;
  }
};

// Initialize immediately if in production
if (process.env.K_SERVICE) {
  stripe = initializeStripe();
  if (!stripe) console.error("Failed to initialize Stripe in production");
}

// Lazy-initialize Sanity write client (requires SANITY_PROJECT_ID, SANITY_DATASET, SANITY_TOKEN secrets)
let sanityWriteClient = null;
const getSanityClient = () => {
  if (!sanityWriteClient) {
    const { createClient } = require("@sanity/client");
    sanityWriteClient = createClient({
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET || "production",
      token: process.env.SANITY_TOKEN,
      apiVersion: "2023-05-03",
      useCdn: false,
    });
  }
  return sanityWriteClient;
};

// Firebase deployment config
setGlobalOptions({
  region: CONFIG.region,
  timeoutSeconds: CONFIG.timeoutSeconds,
  memory: CONFIG.memory,
  maxInstances: CONFIG.maxInstances,
});

// Allowed origins — configurable via ALLOWED_ORIGINS env var (comma-separated)
const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "https://bg-jojo.web.app",
  "https://bg-jojo.firebaseapp.com",
  "https://givebackjojo.org",
];

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ?
  process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean) :
  DEFAULT_ORIGINS;

// Derive hostname list for redirect URL validation
const ALLOWED_REDIRECT_DOMAINS = ALLOWED_ORIGINS.map(origin => {
  try {
    return new URL(origin).hostname;
  } catch {
    return origin; // fallback: treat raw string as hostname
  }
});

/**
 * Verifies that the authenticated user has admin role
 * @param {string} uid - The user's Firebase UID
 * @returns {Promise<void>}
 * @throws {HttpsError} If user is not an admin
 */
const requireAdmin = async uid => {
  const userDoc = await admin.firestore().collection("users").doc(uid).get();
  if (!userDoc.exists || userDoc.data().role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access required");
  }
};

// Create Express app for HTTP endpoints
const app = express();

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`Origin ${origin} not allowed by CORS`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Webhook route must be registered BEFORE express.json() to access raw body
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    if (!stripe) stripe = initializeStripe();
    if (!stripe) throw new Error("Payment service unavailable");

    const sig = req.headers["stripe-signature"];
    if (!sig) return res.status(400).json({ error: "Missing stripe-signature header" });

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("Webhook secret not configured");

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    const db = admin.firestore();

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        if (pi.metadata?.type === "donation" && pi.metadata?.donationId) {
          const donRef = db.collection("donations").doc(pi.metadata.donationId);
          const donSnap = await donRef.get();
          if (donSnap.exists && donSnap.data().status !== "paid") {
            await donRef.update({
              status: "paid",
              stripePaymentIntentId: pi.id,
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        } else if (pi.metadata?.orderId) {
          const orderRef = db.collection("orders").doc(pi.metadata.orderId);
          const orderSnap = await orderRef.get();
          if (orderSnap.exists && orderSnap.data().status !== "paid") {
            await orderRef.update({
              status: "paid",
              paymentId: pi.id,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        if (pi.metadata?.type === "donation" && pi.metadata?.donationId) {
          await db.collection("donations").doc(pi.metadata.donationId).update({
            status: "failed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else if (pi.metadata?.orderId) {
          await db.collection("orders").doc(pi.metadata.orderId).update({
            status: "failed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        Sentry.captureEvent({
          message: "Stripe payment_intent.payment_failed",
          level: "error",
          extra: { paymentIntentId: pi.id, metadata: pi.metadata },
        });
        await notifyDiscord(
          "Payment Failed",
          `A ${pi.metadata?.type === "donation" ? "donation" : "order"} payment failed.`,
          [
            { name: "Payment Intent", value: pi.id, inline: false },
            { name: "Amount", value: `$${((pi.amount || 0) / 100).toFixed(2)}`, inline: true },
            { name: "Error", value: pi.last_payment_error?.message || "Unknown", inline: false },
          ]
        );
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.metadata?.type === "donation" && session.metadata?.donationId) {
          const donRef = db.collection("donations").doc(session.metadata.donationId);
          const donSnap = await donRef.get();
          const targetStatus = session.mode === "subscription" ? "active" : "paid";
          if (donSnap.exists && !["paid", "active"].includes(donSnap.data().status)) {
            const updateData = {
              status: targetStatus,
              stripeSessionId: session.id,
              stripeCustomerId: session.customer || null,
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (session.subscription) {
              updateData.stripeSubscriptionId = session.subscription;
            }
            await donRef.update(updateData);
          }
        } else if (session.metadata?.orderId) {
          const orderRef = db.collection("orders").doc(session.metadata.orderId);
          const orderSnap = await orderRef.get();
          if (orderSnap.exists && orderSnap.data().status !== "paid") {
            await orderRef.update({
              status: "paid",
              paymentId: session.id,
              total: (session.amount_total || 0) / 100,
              taxAmount: (session.total_details?.amount_tax || 0) / 100,
              shippingCost: (session.total_details?.amount_shipping || 0) / 100,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object;
        if (invoice.subscription_details?.metadata?.type === "donation") {
          const donationId = invoice.subscription_details.metadata.donationId;
          if (donationId) {
            await db.collection("donations").doc(donationId).update({
              status: "active",
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (invoice.subscription_details?.metadata?.type === "donation") {
          const donationId = invoice.subscription_details.metadata.donationId;
          if (donationId) {
            await db.collection("donations").doc(donationId).update({
              status: "failed",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
        Sentry.captureEvent({
          message: "Stripe invoice.payment_failed",
          level: "error",
          extra: { invoiceId: invoice.id, metadata: invoice.subscription_details?.metadata },
        });
        await notifyDiscord(
          "Subscription Payment Failed",
          "A recurring donation invoice payment failed.",
          [
            { name: "Invoice ID", value: invoice.id, inline: false },
            { name: "Amount Due", value: `$${((invoice.amount_due || 0) / 100).toFixed(2)}`, inline: true },
            { name: "Attempt Count", value: String(invoice.attempt_count || 1), inline: true },
          ]
        );
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        if (subscription.metadata?.type === "donation" && subscription.metadata?.donationId) {
          const donRef = db.collection("donations").doc(subscription.metadata.donationId);
          const donSnap = await donRef.get();
          if (donSnap.exists && donSnap.data().status !== "cancelled") {
            await donRef.update({
              status: "cancelled",
              cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;
        if (paymentIntentId) {
          // Orders paid via card store paymentId as pi_...; orders via Checkout store cs_...
          // Search both to ensure refunds update correctly regardless of payment method.
          const [byPi, byCs] = await Promise.all([
            db.collection("orders").where("paymentId", "==", paymentIntentId).limit(1).get(),
            (async () => {
              // Resolve the checkout session ID from the payment intent via Stripe API
              try {
                const sessions = await stripe.checkout.sessions.list({
                  payment_intent: paymentIntentId,
                  limit: 1,
                });
                const sessionId = sessions.data[0]?.id || null;
                if (!sessionId) return { empty: true, docs: [] };
                return db.collection("orders").where("paymentId", "==", sessionId).limit(1).get();
              } catch {
                return { empty: true, docs: [] };
              }
            })(),
          ]);

          const orderDoc = !byPi.empty ? byPi.docs[0] : !byCs.empty ? byCs.docs[0] : null;
          if (orderDoc) {
            await orderDoc.ref.update({
              status: "refunded",
              refundedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object;
        const disputePaymentIntentId = dispute.payment_intent;
        Sentry.captureEvent({
          message: "Stripe chargeback dispute opened",
          level: "error",
          extra: {
            disputeId: dispute.id, paymentIntentId: disputePaymentIntentId,
            reason: dispute.reason, amount: dispute.amount,
          },
        });
        await notifyDiscord(
          "⚠️ Chargeback Dispute Opened",
          `A dispute was filed. You must respond before the deadline or it will be automatically lost.`,
          [
            { name: "Dispute ID", value: dispute.id, inline: false },
            { name: "Payment Intent", value: disputePaymentIntentId || "N/A", inline: false },
            { name: "Amount", value: `$${((dispute.amount || 0) / 100).toFixed(2)}`, inline: true },
            { name: "Reason", value: dispute.reason || "unknown", inline: true },
            { name: "Due By", value: dispute.evidence_details?.due_by ?
              new Date(dispute.evidence_details.due_by * 1000).toUTCString() :
              "Check Stripe Dashboard", inline: false },
          ],
          15158332 // red
        );
        // Mark the order as disputed in Firestore if we can find it
        // Search both pi_... (card payment) and cs_... (Checkout) paymentId forms.
        if (disputePaymentIntentId) {
          let disputeOrderDoc = null;

          const byPi = await db.collection("orders")
            .where("paymentId", "==", disputePaymentIntentId)
            .limit(1)
            .get();

          if (!byPi.empty) {
            disputeOrderDoc = byPi.docs[0];
          } else {
            try {
              const sessions = await stripe.checkout.sessions.list({
                payment_intent: disputePaymentIntentId,
                limit: 1,
              });
              const sessionId = sessions.data[0]?.id || null;
              if (sessionId) {
                const byCs = await db.collection("orders")
                  .where("paymentId", "==", sessionId)
                  .limit(1)
                  .get();
                if (!byCs.empty) disputeOrderDoc = byCs.docs[0];
              }
            } catch (err) {
              console.error("Failed to resolve session for dispute order lookup:", err.message);
            }
          }

          if (disputeOrderDoc) {
            await disputeOrderDoc.ref.update({
              status: "disputed",
              disputeId: dispute.id,
              disputeReason: dispute.reason,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// JSON parsing for all other routes
app.use(express.json({ limit: "10kb" }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
}));

// HTTP API Endpoints
app.get("/healthz", (req, res) => res.status(200).send("OK"));

// Root endpoint — returns minimal status only (no internal config disclosed)
app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

// Error handling for the Express app
app.use((err, req, res, _next) => { // Prefix unused parameter with underscore
  console.error("Server error:", err);
  Sentry.captureException(err, { tags: { domain: "http", path: req.path } });
  res.status(500).json({ error: "Internal server error" });
});

// Export the HTTP API function (webhook + REST endpoints)
// Called by the frontend to forward auth errors to Discord
exports.reportError = onCall({}, async request => {
  const { title, message, method, code } = request.data || {};
  await notifyDiscord(
    title || "Auth Error",
    message || "An authentication error occurred.",
    [
      { name: "Method", value: method || "unknown", inline: true },
      { name: "Code", value: code || "unknown", inline: true },
    ],
    15158332 // red
  );
  return { ok: true };
});

exports.httpApi = onRequest({
  minInstances: CONFIG.minInstances,
  invoker: "public",
  cors: false, // CORS is handled by Express corsOptions middleware — do not override with true
  secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
}, app);

/**
 * Callable function for Firebase SDK
 * @param {object} request The callable request object
 * @returns {object} Response data
 * @throws {Error} If payment service is unavailable or invalid request
 */
exports.api = onCall({
  secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "SANITY_PROJECT_ID", "SANITY_DATASET", "SANITY_TOKEN", "SHIPSTATION_API_KEY", "SHIPSTATION_SECRET_KEY"],
}, async request => {
  // Initialize Stripe if not already done
  if (!stripe) stripe = initializeStripe();
  if (!stripe) throw new Error("Payment service unavailable");

  // Get the endpoint from request data
  const { endpoint, ...data } = request.data;

  try {
  // Get real-time USPS shipping rates via ShipStation
    if (endpoint === "getShippingRates") {
      const { items, toAddress } = data;
      if (!items?.length) throw new HttpsError("invalid-argument", "No items provided");
      if (!toAddress?.zipCode) throw new HttpsError("invalid-argument", "Destination address required");

      const DEFAULT_WEIGHT_OZ = 8;
      const DEFAULT_LENGTH = 12;
      const DEFAULT_WIDTH = 9;
      const DEFAULT_HEIGHT = 4;

      const totalWeight = items.reduce(
        (sum, item) => sum + ((item.weightOz || DEFAULT_WEIGHT_OZ) * item.quantity), 0
      );
      const maxLength = Math.max(...items.map(i => i.lengthIn || DEFAULT_LENGTH));
      const maxWidth = Math.max(...items.map(i => i.widthIn || DEFAULT_WIDTH));
      const maxHeight = Math.max(...items.map(i => i.heightIn || DEFAULT_HEIGHT));

      const auth = Buffer.from(
        `${process.env.SHIPSTATION_API_KEY}:${process.env.SHIPSTATION_SECRET_KEY}`
      ).toString("base64");

      const authHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      };

      // Fetch connected carriers so we don't hardcode one that may not be on the account
      const carriersResponse = await fetch("https://ssapi.shipstation.com/carriers", {
        headers: authHeaders,
      });
      if (!carriersResponse.ok) {
        const err = await carriersResponse.text();
        console.error("ShipStation carriers error:", err);
        throw new HttpsError("internal", "Could not fetch shipping carriers");
      }
      const carriers = await carriersResponse.json();
      const carrierCodes = (Array.isArray(carriers) ? carriers : []).map(c => c.code);
      if (!carrierCodes.length) throw new HttpsError("internal", "No carriers connected to ShipStation account");

      const rateBody = {
        serviceCode: null,
        packageCode: null,
        fromPostalCode: "84045",
        toState: toAddress.state,
        toCountry: toAddress.country || "US",
        toPostalCode: toAddress.zipCode,
        toCity: toAddress.city,
        weight: { value: totalWeight, units: "ounces" },
        dimensions: { units: "inches", length: maxLength, width: maxWidth, height: maxHeight },
        confirmation: "none",
        residential: true,
      };

      // Fetch rates for all connected carriers in parallel
      const rateResults = await Promise.allSettled(
        carrierCodes.map(carrierCode =>
          fetch("https://ssapi.shipstation.com/shipments/getrates", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ ...rateBody, carrierCode }),
          }).then(r => r.json())
        )
      );

      const carrierNameMap = Object.fromEntries(
        (Array.isArray(carriers) ? carriers : []).map(c => [c.code, c.name])
      );

      const rates = rateResults
        .flatMap((result, i) => {
          if (result.status !== "fulfilled" || !Array.isArray(result.value)) return [];
          const carrierCode = carrierCodes[i];
          const carrierName = carrierNameMap[carrierCode] || carrierCode;
          return result.value.map(r => ({
            id: `${carrierCode}:${r.serviceCode}`,
            service: r.serviceName,
            carrier: carrierName,
            rate: r.shipmentCost + (r.otherCost || 0),
            deliveryDays: r.days || null,
          }));
        })
        .sort((a, b) => a.rate - b.rate);

      return { rates };
    }

    // Calculate tax for an order (used for display in the card payment flow)
    if (endpoint === "calculateTax") {
      const { items, shippingAddress, shippingCost } = data;
      if (!items?.length) throw new HttpsError("invalid-argument", "No items provided");
      if (!shippingAddress?.country) throw new HttpsError("invalid-argument", "Shipping address required");

      /* eslint-disable camelcase */
      const lineItems = items.map(item => ({
        amount: Math.round(item.price * item.quantity * 100),
        reference: String(item.id || item.name).substring(0, 500),
        tax_behavior: "exclusive",
        tax_code: "txcd_00000000", // non-taxable — only shipping is taxed
      }));

      const calculation = await stripe.tax.calculations.create({
        currency: "usd",
        line_items: lineItems,
        ...(shippingCost > 0 && {
          shipping_cost: { amount: Math.round(shippingCost * 100), tax_behavior: "exclusive" },
        }),
        customer_details: {
          address: {
            line1: shippingAddress.address || "",
            city: shippingAddress.city || "",
            state: shippingAddress.state || "",
            postal_code: shippingAddress.zipCode || "",
            country: shippingAddress.country,
          },
          address_source: "shipping",
        },
      });
      /* eslint-enable camelcase */

      return {
        calculationId: calculation.id,
        taxAmount: calculation.tax_amount_exclusive / 100,
      };
    }

    if (endpoint === "createPaymentIntent") {
      const { amount, currency = "usd", metadata = {}, receipt_email } = data;

      if (!amount || isNaN(amount) || amount < 50) {
        throw new HttpsError("invalid-argument", "Invalid amount");
      }

      let verifiedAmount = Math.round(amount);
      let taxCalculationId = null;

      // Server-side verification: recalculate tax authoritatively for shipped orders
      if (metadata.orderId) {
        const db = admin.firestore();
        const orderSnap = await db.collection("orders").doc(metadata.orderId).get();
        if (!orderSnap.exists) {
          throw new HttpsError("not-found", "Order not found");
        }
        const order = orderSnap.data();

        const subtotalCents = order.items.reduce(
          (sum, item) => sum + Math.round(item.price * item.quantity * 100), 0
        );
        let expectedAmount = subtotalCents;
        const taxUpdate = { subtotal: subtotalCents / 100 };

        // Compute shipping cost authoritatively from settings (flat-rate)
        let computedShippingCost = 0;
        if (order.fulfillmentType === "shipping") {
          const shippingSettingsSnap = await db.collection("settings").doc("shipping").get();
          const shippingSettings = shippingSettingsSnap.exists ? shippingSettingsSnap.data() : null;
          if (shippingSettings?.enabled) {
            const subtotal = subtotalCents / 100;
            const belowThreshold = !shippingSettings.freeShippingThreshold ||
              subtotal < shippingSettings.freeShippingThreshold;
            computedShippingCost = belowThreshold ? (shippingSettings.flatRate || 0) : 0;
          }
        }

        const needsTax =
          (order.fulfillmentType === "shipping" && order.shippingInfo?.country) ||
          (order.fulfillmentType === "pickup" && order.shippingInfo?.country);

        let taxAvailable = false;

        if (needsTax) {
          try {
            /* eslint-disable camelcase */
            const shippingCostCents = Math.round(computedShippingCost * 100);
            const taxCalc = await stripe.tax.calculations.create({
              currency: "usd",
              line_items: order.items.map(item => ({
                amount: Math.round(item.price * item.quantity * 100),
                reference: String(item.id || item.name).substring(0, 500),
                tax_behavior: "exclusive",
                tax_code: "txcd_00000000", // non-taxable — only shipping is taxed
              })),
              ...(shippingCostCents > 0 && {
                shipping_cost: { amount: shippingCostCents, tax_behavior: "exclusive" },
              }),
              customer_details: {
                address: {
                  line1: order.shippingInfo.address || "",
                  city: order.shippingInfo.city || "",
                  state: order.shippingInfo.state || "",
                  postal_code: order.shippingInfo.zipCode || "",
                  country: order.shippingInfo.country,
                },
                address_source: "shipping",
              },
            });
            /* eslint-enable camelcase */
            const taxCents = taxCalc.tax_amount_exclusive;
            expectedAmount = subtotalCents + taxCents;
            taxUpdate.taxAmount = taxCents / 100;
            taxUpdate.taxCalculationId = taxCalc.id;
            taxCalculationId = taxCalc.id;
            taxAvailable = true;
          } catch (taxErr) {
            console.warn("Stripe Tax unavailable, will accept client amount if ≥ subtotal + shipping:", taxErr.message);
            expectedAmount = subtotalCents;
          }
        }

        // Add shipping cost for shipped orders
        if (computedShippingCost > 0) {
          const shippingCents = Math.round(computedShippingCost * 100);
          expectedAmount += shippingCents;
          taxUpdate.shippingCost = computedShippingCost;
        }

        if (taxAvailable) {
          // Allow ±1 cent tolerance to absorb floating-point rounding in subtotal+tax arithmetic
          if (Math.abs(verifiedAmount - expectedAmount) > 1) {
            console.error(`Amount mismatch for order ${metadata.orderId}: client sent ${verifiedAmount}, expected ${expectedAmount}`);
            throw new HttpsError("invalid-argument", "Payment amount does not match order total");
          }
        } else {
          // Stripe Tax was unavailable — verify client is paying at least subtotal + shipping
          if (verifiedAmount < expectedAmount - 1) {
            console.error(`Underpayment for order ${metadata.orderId}: client sent ${verifiedAmount}, minimum ${expectedAmount}`);
            throw new HttpsError("invalid-argument", "Payment amount is less than the order total");
          }
          // Use client-supplied amount (includes their previously calculated tax estimate)
          expectedAmount = verifiedAmount;
        }

        await db.collection("orders").doc(metadata.orderId).update({
          ...taxUpdate,
          total: expectedAmount / 100,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        verifiedAmount = expectedAmount;
      }

      // Link the Stripe Tax calculation to this payment intent so it appears in tax reports
      const intentParams = {
        amount: verifiedAmount,
        currency,
        metadata: taxCalculationId ?
          { ...metadata, tax_calculation: taxCalculationId } : // eslint-disable-line camelcase
          metadata,
        automatic_payment_methods: { enabled: true },
      };
      if (receipt_email) {
        intentParams.receipt_email = receipt_email;
      }

      const idempotencyKey = metadata.orderId ?
        `pi_order_${metadata.orderId}` :
        `pi_${crypto.randomUUID()}`;

      const paymentIntent = await stripe.paymentIntents.create(
        intentParams,
        { idempotencyKey }
      );

      return {
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    }

    // Confirm Order Payment — verifies with Stripe and updates Firestore
    if (endpoint === "confirmOrderPayment") {
      const { orderId, paymentIntentId } = data;
      if (!orderId) {
        throw new HttpsError("invalid-argument", "Missing orderId");
      }
      if (!paymentIntentId) {
        throw new HttpsError("invalid-argument", "Missing paymentIntentId");
      }

      const db = admin.firestore();
      const orderRef = db.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        throw new HttpsError("not-found", "Order not found");
      }

      const order = orderSnap.data();

      if (request.auth?.uid && order.userId && order.userId !== request.auth.uid) {
        throw new HttpsError("permission-denied", "Unauthorized");
      }

      if (order.status === "paid") {
        return { success: true, status: "paid" };
      }

      // Verify with Stripe — handle both payment intents (pi_) and checkout sessions (cs_)
      if (paymentIntentId) {
        if (paymentIntentId.startsWith("cs_")) {
          const session = await stripe.checkout.sessions.retrieve(paymentIntentId);
          if (session.payment_status !== "paid") {
            throw new HttpsError("failed-precondition", `Payment not complete. Status: ${session.payment_status}`);
          }
        } else {
          const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (pi.status !== "succeeded") {
            throw new HttpsError("failed-precondition", `Payment not complete. Status: ${pi.status}`);
          }
        }
      }

      await orderRef.update({
        status: "paid",
        ...(paymentIntentId && { paymentId: paymentIntentId }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, status: "paid" };
    }

    // Create Checkout Session
    if (endpoint === "createCheckoutSession") {
      const { items, successUrl, cancelUrl, customerEmail, metadata = {} } = data;
      // fulfillmentType may be top-level or nested inside metadata (frontend sends it both ways)
      const fulfillmentType = data.fulfillmentType || metadata.fulfillmentType;

      if (!items?.length) throw new HttpsError("invalid-argument", "No items provided");

      // Validate URLs are from allowed domains
      const isValidRedirectUrl = url => {
        try {
          const parsed = new URL(url);
          return ALLOWED_REDIRECT_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
        } catch {
          return false;
        }
      };

      if (!isValidRedirectUrl(successUrl) || !isValidRedirectUrl(cancelUrl)) {
        throw new Error("Invalid URL domain");
      }

      const idempotencyKey = metadata.orderId ?
        `cs_order_${metadata.orderId}` :
        `cs_${crypto.randomUUID()}`;

      // Compute flat-rate shipping for shipped orders
      let shippingAmountCents = 0;
      if (fulfillmentType === "shipping") {
        const db = admin.firestore();
        const shippingSnap = await db.collection("settings").doc("shipping").get();
        const shippingSettings = shippingSnap.exists ? shippingSnap.data() : null;
        if (shippingSettings?.enabled) {
          const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const belowThreshold = !shippingSettings.freeShippingThreshold ||
            subtotal < shippingSettings.freeShippingThreshold;
          shippingAmountCents = belowThreshold ? Math.round((shippingSettings.flatRate || 0) * 100) : 0;
        }
      }

      /* eslint-disable camelcase */
      const lineItems = items.map(item => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            ...(item.size && item.size !== "N/A" && { description: `Size: ${item.size}` }),
            tax_code: "txcd_00000000", // non-taxable — only shipping is taxed
          },
          unit_amount: Math.round(item.price * 100),
          tax_behavior: "exclusive",
        },
        quantity: item.quantity,
      }));

      const sessionParams = {
        payment_method_types: ["card"],
        line_items: lineItems,
        automatic_tax: { enabled: true },
        mode: "payment",
        // successUrl already contains ?session_id={CHECKOUT_SESSION_ID}&order_id=... — do not append again
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata,
        expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
        billing_address_collection: "required",
        allow_promotion_codes: true,
      };

      if (fulfillmentType === "shipping") {
        sessionParams.shipping_address_collection = {
          allowed_countries: ["US", "CA", "GB", "AU"],
        };
      }

      if (shippingAmountCents > 0) {
        sessionParams.shipping_options = [{
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shippingAmountCents, currency: "usd" },
            display_name: "Standard Shipping",
            tax_behavior: "exclusive",
          },
        }];
      }

      const session = await stripe.checkout.sessions.create(sessionParams, { idempotencyKey });

      // Write shippingCost to the order doc so it's available before the webhook fires
      if (metadata.orderId && shippingAmountCents > 0) {
        const db = admin.firestore();
        await db.collection("orders").doc(metadata.orderId).update({
          shippingCost: shippingAmountCents / 100,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      /* eslint-enable camelcase */
      return {
        id: session.id,
        url: session.url,
        expires: session.expires_at,
      };
    }

    // Create Donation Payment Intent
    if (endpoint === "createDonationPaymentIntent") {
      const { amountCents, currency = "usd", donorInfo = {}, frequency = "one_time" } = data;

      if (!amountCents || isNaN(amountCents) || amountCents < 100) {
        throw new Error("Invalid amount. Minimum donation is $1.00");
      }
      if (amountCents > 5000000) {
        throw new Error("Amount exceeds maximum donation limit");
      }

      const db = admin.firestore();
      const donationRef = await db.collection("donations").add({
        donorEmail: donorInfo.email || null,
        donorName: donorInfo.firstName && donorInfo.lastName ?
          `${donorInfo.firstName} ${donorInfo.lastName}` : null,
        userId: request.auth?.uid || null,
        amount: amountCents / 100,
        amountCents,
        currency,
        frequency,
        paymentMethod: "card",
        stripePaymentIntentId: null,
        stripeSessionId: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        status: "pending",
        tierDescription: donorInfo.tierDescription || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paidAt: null,
        cancelledAt: null,
      });

      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: Math.round(amountCents),
          currency,
          description: "Donation to Give Back Jojo",
          statement_descriptor: "GIVE BACK JOJO", // eslint-disable-line camelcase
          metadata: {
            type: "donation",
            donationId: donationRef.id,
            userId: (request.auth?.uid || "guest").toString(),
            donorEmail: (donorInfo.email || "").toString(),
            frequency,
          },
          automatic_payment_methods: { enabled: true },
        },
        { idempotencyKey: `pi_donation_${donationRef.id}` }
      );

      await donationRef.update({ stripePaymentIntentId: paymentIntent.id });

      return {
        clientSecret: paymentIntent.client_secret,
        donationId: donationRef.id,
      };
    }

    // Confirm Donation Payment — verifies with Stripe and updates Firestore
    if (endpoint === "confirmDonationPayment") {
      const { donationId, paymentIntentId } = data;
      if (!donationId || !paymentIntentId) {
        throw new HttpsError("invalid-argument", "Missing donationId or paymentIntentId");
      }

      const db = admin.firestore();
      const donationRef = db.collection("donations").doc(donationId);
      const donationSnap = await donationRef.get();

      if (!donationSnap.exists) {
        throw new HttpsError("not-found", "Donation not found");
      }

      const donation = donationSnap.data();

      // Only the donor or the backend can confirm
      if (request.auth?.uid && donation.userId && donation.userId !== request.auth.uid) {
        throw new HttpsError("permission-denied", "Unauthorized");
      }

      // Skip if already paid
      if (donation.status === "paid") {
        return { success: true, status: "paid" };
      }

      // Verify with Stripe that the payment actually succeeded
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (pi.status !== "succeeded") {
        throw new HttpsError("failed-precondition", `Payment not complete. Status: ${pi.status}`);
      }

      await donationRef.update({
        status: "paid",
        stripePaymentIntentId: paymentIntentId,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, status: "paid" };
    }

    // Confirm Donation Checkout — verifies checkout session with Stripe and updates Firestore
    if (endpoint === "confirmDonationCheckout") {
      const { donationId, sessionId } = data;
      if (!donationId) {
        throw new HttpsError("invalid-argument", "Missing donationId");
      }
      if (!sessionId) {
        throw new HttpsError("invalid-argument", "Missing sessionId");
      }

      const db = admin.firestore();
      const donationRef = db.collection("donations").doc(donationId);
      const donationSnap = await donationRef.get();

      if (!donationSnap.exists) {
        throw new HttpsError("not-found", "Donation not found");
      }

      const donation = donationSnap.data();

      if (request.auth?.uid && donation.userId && donation.userId !== request.auth.uid) {
        throw new HttpsError("permission-denied", "Unauthorized");
      }

      // Skip if already confirmed
      if (["paid", "active"].includes(donation.status)) {
        return { success: true, status: donation.status };
      }

      // Verify with Stripe if sessionId provided
      const updateData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== "paid") {
        throw new HttpsError("failed-precondition", `Payment not complete. Status: ${session.payment_status}`);
      }
      updateData.stripeSessionId = sessionId;
      updateData.stripeCustomerId = session.customer || null;
      if (session.subscription) {
        updateData.stripeSubscriptionId = session.subscription;
        updateData.status = "active";
      } else {
        updateData.status = "paid";
      }

      await donationRef.update(updateData);

      return { success: true, status: updateData.status };
    }

    // Create Donation Checkout Session
    if (endpoint === "createDonationCheckoutSession") {
      const { amountCents, currency = "usd", donorInfo = {}, frequency = "one_time", successUrl, cancelUrl } = data;

      if (!amountCents || isNaN(amountCents) || amountCents < 100) {
        throw new Error("Invalid amount. Minimum donation is $1.00");
      }
      if (amountCents > 5000000) {
        throw new Error("Amount exceeds maximum donation limit");
      }

      const isValidRedirectUrl = url => {
        try {
          const parsed = new URL(url);
          return ALLOWED_REDIRECT_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
        } catch {
          return false;
        }
      };

      if (!isValidRedirectUrl(successUrl) || !isValidRedirectUrl(cancelUrl)) {
        throw new Error("Invalid URL domain");
      }

      const db = admin.firestore();
      const donationRef = await db.collection("donations").add({
        donorEmail: donorInfo.email || null,
        donorName: donorInfo.firstName && donorInfo.lastName ?
          `${donorInfo.firstName} ${donorInfo.lastName}` : null,
        userId: request.auth?.uid || null,
        amount: amountCents / 100,
        amountCents,
        currency,
        frequency,
        paymentMethod: "stripe_checkout",
        stripePaymentIntentId: null,
        stripeSessionId: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        status: "pending",
        tierDescription: donorInfo.tierDescription || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paidAt: null,
        cancelledAt: null,
      });

      const sessionParams = {
        payment_method_types: ["card"],
        customer_email: donorInfo.email || undefined,
        metadata: {
          type: "donation",
          donationId: donationRef.id,
          userId: (request.auth?.uid || "guest").toString(),
          frequency,
        },
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&donation_id=${donationRef.id}`,
        cancel_url: cancelUrl,
        expires_at: Math.floor(Date.now() / 1000) + 1800,
      };

      if (frequency === "monthly") {
      // eslint-disable-next-line camelcase
        const price = await stripe.prices.create(
          {
            unit_amount: Math.round(amountCents), // eslint-disable-line camelcase
            currency,
            recurring: { interval: "month" },
            product_data: { // eslint-disable-line camelcase
              name: `Monthly Donation - $${(amountCents / 100).toFixed(2)}`,
              metadata: { type: "donation", donationId: donationRef.id },
            },
          },
          { idempotencyKey: `price_donation_${donationRef.id}` }
        );

        sessionParams.mode = "subscription";
        sessionParams.line_items = [{ price: price.id, quantity: 1 }];
        sessionParams.subscription_data = { // eslint-disable-line camelcase
          metadata: {
            type: "donation",
            donationId: donationRef.id,
            userId: (request.auth?.uid || "guest").toString(),
          },
        };
      } else {
        sessionParams.mode = "payment";
        sessionParams.line_items = [{
          price_data: { // eslint-disable-line camelcase
            currency,
            unit_amount: Math.round(amountCents), // eslint-disable-line camelcase
            product_data: { // eslint-disable-line camelcase
              name: `One-Time Donation - $${(amountCents / 100).toFixed(2)}`,
              metadata: { type: "donation", donationId: donationRef.id },
            },
          },
          quantity: 1,
        }];
      }

      const session = await stripe.checkout.sessions.create(
        sessionParams,
        { idempotencyKey: `cs_donation_${donationRef.id}` }
      );

      await donationRef.update({ stripeSessionId: session.id });

      return {
        id: session.id,
        url: session.url,
        donationId: donationRef.id,
      };
    }

    // Cancel Donation Subscription
    if (endpoint === "cancelDonationSubscription") {
      if (!request.auth?.uid) {
        throw new Error("Authentication required");
      }

      const { donationId } = data;
      if (!donationId) throw new Error("Missing donationId");

      const db = admin.firestore();
      const donationRef = db.collection("donations").doc(donationId);
      const donationSnap = await donationRef.get();

      if (!donationSnap.exists) {
        throw new Error("Donation not found");
      }

      const donation = donationSnap.data();

      if (donation.userId !== request.auth.uid) {
        throw new Error("Unauthorized");
      }

      if (!donation.stripeSubscriptionId) {
        throw new Error("No active subscription found for this donation");
      }

      const subscription = await stripe.subscriptions.cancel(
        donation.stripeSubscriptionId,
        { idempotencyKey: `cancel_${donationId}` }
      );

      await donationRef.update({
        status: "cancelled",
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        status: subscription.status,
      };
    }

    // Request Refund (user-facing)
    if (endpoint === "requestRefund") {
      if (!request.auth?.uid) {
        throw new HttpsError("unauthenticated", "Authentication required");
      }

      const { orderId, reason, returnItems } = data;
      if (!orderId) throw new HttpsError("invalid-argument", "Missing orderId");

      const db = admin.firestore();
      const orderRef = db.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        throw new HttpsError("not-found", "Order not found");
      }

      const order = orderSnap.data();

      if (order.userId !== request.auth.uid) {
        throw new HttpsError("permission-denied", "Unauthorized");
      }

      if (!["paid", "shipped"].includes(order.status)) {
        throw new HttpsError("failed-precondition", "This order is not eligible for a return");
      }

      // Determine which items are being returned
      const items = order.items || [];
      let selectedIndices = returnItems;

      if (!Array.isArray(selectedIndices) || selectedIndices.length === 0) {
      // Default to all items (backwards compatible)
        selectedIndices = items.map((_, i) => i);
      }

      // Validate all indices
      for (const idx of selectedIndices) {
        if (typeof idx !== "number" || idx < 0 || idx >= items.length || !Number.isInteger(idx)) {
          throw new HttpsError("invalid-argument", `Invalid item index: ${idx}`);
        }
      }

      // Calculate refund amount
      const refundAmount = selectedIndices.reduce((sum, idx) => {
        const item = items[idx];
        return sum + (item.price || 0) * (item.quantity || 1);
      }, 0);

      await orderRef.update({
        status: "refund_requested",
        refundReason: reason || "No reason provided",
        returnItems: selectedIndices,
        refundAmount,
        refundRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: "Return request submitted" };
    }

    // Approve Return (admin-facing) — marks as return_approved, NO Stripe refund yet
    if (endpoint === "approveRefund") {
      if (!request.auth?.uid) {
        throw new HttpsError("unauthenticated", "Authentication required");
      }
      await requireAdmin(request.auth.uid);

      const { orderId } = data;
      if (!orderId) throw new HttpsError("invalid-argument", "Missing orderId");

      const db = admin.firestore();
      const orderRef = db.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        throw new HttpsError("not-found", "Order not found");
      }

      const order = orderSnap.data();

      if (order.status !== "refund_requested") {
        throw new HttpsError("failed-precondition", "This order does not have a pending refund request");
      }

      await orderRef.update({
        status: "return_approved",
        returnApprovedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: "Return approved — awaiting item" };
    }

    // Process Refund (admin-facing) — triggers Stripe refund after item is received
    if (endpoint === "processRefund") {
      if (!request.auth?.uid) {
        throw new HttpsError("unauthenticated", "Authentication required");
      }
      await requireAdmin(request.auth.uid);

      const { orderId } = data;
      if (!orderId) throw new HttpsError("invalid-argument", "Missing orderId");

      const db = admin.firestore();
      const orderRef = db.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        throw new HttpsError("not-found", "Order not found");
      }

      const order = orderSnap.data();
      console.log("Processing refund for order:", orderId, "paymentId:", order.paymentId, "status:", order.status);

      if (order.status !== "return_approved") {
        throw new HttpsError("failed-precondition", "This order must be in 'return_approved' status to process a refund");
      }

      // Resolve the payment intent ID
      let paymentIntentId = null;

      try {
        if (order.paymentId) {
          if (order.paymentId.startsWith("pi_")) {
            paymentIntentId = order.paymentId;
          } else if (order.paymentId.startsWith("cs_")) {
          // Checkout session — retrieve the payment intent from it
            const session = await stripe.checkout.sessions.retrieve(order.paymentId);
            paymentIntentId = session.payment_intent;
          } else {
          // Try treating it as a payment intent directly
            paymentIntentId = order.paymentId;
          }
        }

        // Fallback: search Stripe for the payment if paymentId is missing or didn't resolve
        if (!paymentIntentId) {
          console.log("No paymentId on order, searching Stripe for orderId:", orderId);

          // Search payment intents by order metadata
          const piSearch = await stripe.paymentIntents.search({
            query: `metadata['orderId']:'${orderId}'`,
            limit: 1,
          });

          if (piSearch.data.length > 0) {
            paymentIntentId = piSearch.data[0].id;
            console.log("Found payment intent via search:", paymentIntentId);
          } else {
          // Search checkout sessions by order metadata
            const csSearch = await stripe.checkout.sessions.search({
              query: `metadata['orderId']:'${orderId}'`,
              limit: 1,
            });

            if (csSearch.data.length > 0 && csSearch.data[0].payment_intent) {
              paymentIntentId = csSearch.data[0].payment_intent;
              console.log("Found payment intent via checkout session search:", paymentIntentId);
            }
          }

          // Save the resolved paymentId for future use
          if (paymentIntentId) {
            await orderRef.update({ paymentId: paymentIntentId });
          }
        }

        if (!paymentIntentId) {
          throw new HttpsError("failed-precondition", "No payment found for this order. Cannot process refund.");
        }

        console.log("Refunding payment intent:", paymentIntentId);

        // Partial refund: if refundAmount exists and is less than order total, pass amount in cents
        const refundParams = { payment_intent: paymentIntentId };
        if (order.refundAmount && order.refundAmount < order.total) {
          refundParams.amount = Math.round(order.refundAmount * 100);
          console.log("Partial refund amount (cents):", refundParams.amount);
        }

        await stripe.refunds.create(
          refundParams,
          { idempotencyKey: `refund_${orderId}` }
        );
      } catch (stripeError) {
        console.error("Stripe refund error:", stripeError);
        if (stripeError instanceof HttpsError) throw stripeError;
        throw new HttpsError("internal", "Refund could not be processed. Please try again or contact support.");
      }

      try {
        await orderRef.update({
          status: "refunded",
          refundAmount: order.refundAmount || order.total,
          refundedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (firestoreError) {
        console.error("Firestore update failed after successful Stripe refund:", firestoreError);
        // Refund succeeded on Stripe — don't throw, just log. Webhook will reconcile.
      }

      return { success: true, message: "Refund processed successfully" };
    }

    // Archive Orders (admin-facing)
    if (endpoint === "archiveOrders") {
      if (!request.auth?.uid) {
        throw new HttpsError("unauthenticated", "Authentication required");
      }
      await requireAdmin(request.auth.uid);

      const { orderIds } = data;
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        throw new HttpsError("invalid-argument", "orderIds must be a non-empty array");
      }
      if (orderIds.length > 250) {
        throw new HttpsError("invalid-argument", "Cannot archive more than 250 orders at once");
      }

      const db = admin.firestore();
      const batch = db.batch();
      let archivedCount = 0;

      for (const orderId of orderIds) {
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) continue;

        const orderData = orderSnap.data();
        const archivedRef = db.collection("archivedOrders").doc(orderId);

        batch.set(archivedRef, {
          ...orderData,
          archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        batch.delete(orderRef);
        archivedCount++;
      }

      if (archivedCount > 0) {
        await batch.commit();
      }

      return { success: true, archivedCount };
    }

    // Deny Refund (admin-facing)
    if (endpoint === "denyRefund") {
      if (!request.auth?.uid) {
        throw new HttpsError("unauthenticated", "Authentication required");
      }
      await requireAdmin(request.auth.uid);

      const { orderId, denyReason } = data;
      if (!orderId) throw new HttpsError("invalid-argument", "Missing orderId");

      const db = admin.firestore();
      const orderRef = db.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        throw new HttpsError("not-found", "Order not found");
      }

      const order = orderSnap.data();

      if (order.status !== "refund_requested") {
        throw new HttpsError("failed-precondition", "This order does not have a pending refund request");
      }

      await orderRef.update({
        status: "paid",
        refundDeniedReason: denyReason || "Request denied",
        refundDeniedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: "Refund request denied" };
    }

    // Get pickup location details — only returned for paid pickup orders
    if (endpoint === "getPickupDetails") {
      const { orderId } = data;
      if (!orderId) throw new HttpsError("invalid-argument", "Missing orderId");

      const db = admin.firestore();
      const orderSnap = await db.collection("orders").doc(orderId).get();
      if (!orderSnap.exists) throw new HttpsError("not-found", "Order not found");

      const order = orderSnap.data();

      if (request.auth?.uid && order.userId && order.userId !== request.auth.uid) {
        throw new HttpsError("permission-denied", "Unauthorized");
      }

      if (order.fulfillmentType !== "pickup") {
        throw new HttpsError("failed-precondition", "Not a pickup order");
      }

      const paidStatuses = ["paid", "shipped", "refund_requested", "return_approved", "refunded"];
      if (!paidStatuses.includes(order.status)) {
        throw new HttpsError("failed-precondition", "Order must be paid before pickup details are available");
      }

      const pickupSnap = await db.collection("settings").doc("pickup").get();
      if (!pickupSnap.exists) {
        return { address: null, hours: null, instructions: null };
      }
      return pickupSnap.data();
    }

    // ─── Sanity Write Proxy ───────────────────────────────────────────────────
    // All browser-side Sanity write operations are proxied through here so the
    // write token never ships in the React bundle.

    if (endpoint === "sanity/user.sync") {
      // Sync Firebase user to Sanity — called on every auth state change
      if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required");
      const { uid, name, email, photoURL, authProvider, emailVerified } = data;
      if (uid !== request.auth.uid) throw new HttpsError("permission-denied", "Unauthorized");

      const sanity = getSanityClient();
      const existing = await sanity.fetch(`*[_type == "user" && uid == $uid][0]`, { uid });

      if (!existing) {
        const created = await sanity.createOrReplace({
          _id: uid,
          _type: "user",
          uid,
          name: name || email?.split("@")[0] || "New User",
          email: email || null,
          photoURL: photoURL || null,
          role: "user",
          authProvider: authProvider || "password",
          emailVerified: Boolean(emailVerified),
        });
        return { created: true, user: created };
      }

      const updates = {};
      if (name && name !== existing.name) updates.name = name;
      if (photoURL && photoURL !== existing.photoURL) updates.photoURL = photoURL;
      if (Object.keys(updates).length > 0) {
        const updated = await sanity.patch(existing._id).set(updates).commit();
        return { updated: true, user: updated };
      }
      return { updated: false, user: existing };
    }

    if (endpoint === "sanity/article.create") {
      if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required");
      const { title, content, mainImage, isAnonymous, publishedDate, readingTime, slug } = data;
      if (!title || !content) throw new HttpsError("invalid-argument", "Title and content are required");

      const sanity = getSanityClient();
      const slugValue = slug || title
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      const doc = {
        _type: "article",
        title,
        slug: { current: slugValue },
        content,
        mainImage: mainImage || null,
        author: { _type: "reference", _ref: request.auth.uid },
        isAnonymous: Boolean(isAnonymous),
        publishedDate: publishedDate || new Date().toISOString(),
        readingTime: readingTime || 5,
        likes: 0,
        views: 0,
        lastViewDate: null,
      };
      const created = await sanity.create(doc);
      return { success: true, article: created };
    }

    if (endpoint === "sanity/article.update") {
      if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required");
      const { articleId, updates } = data;
      if (!articleId) throw new HttpsError("invalid-argument", "Missing articleId");

      const sanity = getSanityClient();
      const article = await sanity.getDocument(articleId);
      if (!article) throw new HttpsError("not-found", "Article not found");
      if (article.author?._ref !== request.auth.uid) {
        throw new HttpsError("permission-denied", "Not the article author");
      }

      const allowedFields = ["title", "content", "mainImage", "isAnonymous", "tags", "readingTime"];
      const safeUpdates = Object.fromEntries(
        Object.entries(updates).filter(([k]) => allowedFields.includes(k))
      );
      const updated = await sanity.patch(articleId).set(safeUpdates).commit();
      return { success: true, article: updated };
    }

    if (endpoint === "sanity/article.delete") {
      if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required");
      const { articleId } = data;
      if (!articleId) throw new HttpsError("invalid-argument", "Missing articleId");

      const sanity = getSanityClient();
      const article = await sanity.getDocument(articleId);
      if (!article) throw new HttpsError("not-found", "Article not found");

      // Only the author or an admin may delete
      const isOwner = article.author?._ref === request.auth.uid;
      let isAdmin = false;
      if (!isOwner) {
        try {
          await requireAdmin(request.auth.uid);
          isAdmin = true;
        } catch (_) {
          // not an admin
        }
      }
      if (!isOwner && !isAdmin) throw new HttpsError("permission-denied", "Not the article author");

      // Delete all referencing documents first (comments, likes, etc.)
      const refs = await sanity.fetch(`*[references($id)]{_id, _type}`, { id: articleId });
      for (const ref of refs) {
        await sanity.delete(ref._id).catch(() => {});
      }
      await sanity.delete(articleId);
      return { success: true };
    }

    if (endpoint === "sanity/article.toggleLike") {
      if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required");
      const { articleId } = data;
      if (!articleId) throw new HttpsError("invalid-argument", "Missing articleId");

      const sanity = getSanityClient();
      const article = await sanity.getDocument(articleId);
      if (!article) throw new HttpsError("not-found", "Article not found");

      const isLiked = article.likedBy?.some(ref => ref._ref === request.auth.uid);
      const patch = sanity.patch(articleId).setIfMissing({ likedBy: [], likes: 0 });

      if (isLiked) {
        patch.unset([`likedBy[_ref == "${request.auth.uid}"]`]).dec({ likes: 1 });
      } else {
        patch.insert("after", "likedBy[-1]", [{ _type: "reference", _ref: request.auth.uid }]).inc({ likes: 1 });
      }
      const updated = await patch.commit();

      if (!isLiked && article.author?._ref && article.author._ref !== request.auth.uid) {
        await sanity.create({
          _type: "notification",
          user: { _type: "reference", _ref: article.author._ref },
          sender: { _type: "reference", _ref: request.auth.uid },
          type: "like",
          article: { _type: "reference", _ref: articleId },
          seen: false,
          createdAt: new Date().toISOString(),
        }).catch(() => {});
      }
      return { success: true, liked: !isLiked, likes: updated.likes };
    }

    if (endpoint === "sanity/article.incrementViews") {
      const { articleId } = data;
      if (!articleId) throw new HttpsError("invalid-argument", "Missing articleId");
      const sanity = getSanityClient();
      const result = await sanity.patch(articleId).setIfMissing({ views: 0 }).inc({ views: 1 }).commit();
      return { success: true, views: result.views };
    }

    if (endpoint === "sanity/comment.create") {
      if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required");
      const { articleId, content } = data;
      if (!articleId || !content?.trim()) throw new HttpsError("invalid-argument", "Missing articleId or content");
      if (content.length > 2000) throw new HttpsError("invalid-argument", "Comment too long");

      const sanity = getSanityClient();
      const article = await sanity.getDocument(articleId);
      if (!article) throw new HttpsError("not-found", "Article not found");

      const comment = await sanity.create({
        _type: "comment",
        article: { _type: "reference", _ref: articleId },
        author: { _type: "reference", _ref: request.auth.uid },
        content: content.trim(),
        _createdAt: new Date().toISOString(),
      });

      if (article.author?._ref && article.author._ref !== request.auth.uid) {
        await sanity.create({
          _type: "notification",
          user: { _type: "reference", _ref: article.author._ref },
          sender: { _type: "reference", _ref: request.auth.uid },
          type: "comment",
          article: { _type: "reference", _ref: articleId },
          comment: { _type: "reference", _ref: comment._id },
          seen: false,
          createdAt: new Date().toISOString(),
        }).catch(() => {});
      }
      return { success: true, comment };
    }

    if (endpoint === "sanity/comment.delete") {
      if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required");
      const { commentId } = data;
      if (!commentId) throw new HttpsError("invalid-argument", "Missing commentId");

      const sanity = getSanityClient();
      const comment = await sanity.getDocument(commentId);
      if (!comment) throw new HttpsError("not-found", "Comment not found");
      if (comment.author?._ref !== request.auth.uid) {
        throw new HttpsError("permission-denied", "Not the comment author");
      }
      await sanity.delete(commentId);
      return { success: true };
    }

    if (endpoint === "sanity/notification.markRead") {
      if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required");
      const { notificationIds } = data;
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new HttpsError("invalid-argument", "Missing notificationIds array");
      }

      const sanity = getSanityClient();
      // Only allow patching notifications belonging to this user
      const docs = await sanity.fetch(
        `*[_id in $ids && user._ref == $uid]{_id}`,
        { ids: notificationIds, uid: request.auth.uid }
      );
      const allowedIds = docs.map(d => d._id);
      await Promise.all(
        allowedIds.map(id =>
          sanity.patch(id).set({ seen: true, readAt: new Date().toISOString() }).commit()
        )
      );
      return { success: true, updated: allowedIds.length };
    }

    if (endpoint === "sanity/notification.delete") {
      if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required");
      const { notificationIds } = data;
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new HttpsError("invalid-argument", "Missing notificationIds array");
      }

      const sanity = getSanityClient();
      // Only allow deleting notifications belonging to this user
      const docs = await sanity.fetch(
        `*[_id in $ids && user._ref == $uid]{_id}`,
        { ids: notificationIds, uid: request.auth.uid }
      );
      const allowedIds = docs.map(d => d._id);
      await Promise.all(allowedIds.map(id => sanity.delete(id).catch(() => {})));
      return { success: true, deleted: allowedIds.length };
    }

    if (endpoint === "sanity/media.upload") {
      if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required");
      const { base64, filename, contentType } = data;
      if (!base64 || !filename || !contentType) throw new HttpsError("invalid-argument", "Missing file data");

      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!validTypes.includes(contentType)) throw new HttpsError("invalid-argument", "Invalid file type");

      const buffer = Buffer.from(base64, "base64");
      if (buffer.length > 10 * 1024 * 1024) throw new HttpsError("invalid-argument", "File exceeds 10MB limit");

      const sanity = getSanityClient();
      const result = await sanity.assets.upload("image", buffer, { filename, contentType });
      return {
        success: true,
        asset: { _type: "image", asset: { _type: "reference", _ref: result._id } },
      };
    }

    throw new Error(`Unknown endpoint: ${endpoint}`);
  } catch (error) {
    const paymentEndpoints = [
      "createPaymentIntent", "createDonationPaymentIntent",
      "confirmOrderPayment", "confirmDonationPayment",
      "createCheckoutSession", "createDonationCheckoutSession",
      "confirmDonationCheckout",
    ];
    Sentry.captureException(error, {
      tags: { endpoint: endpoint || "unknown", domain: paymentEndpoints.includes(endpoint) ? "payment" : "api" },
    });
    if (paymentEndpoints.includes(endpoint) && !(error instanceof HttpsError && error.code === "permission-denied")) {
      await notifyDiscord(
        "Payment API Error",
        `\`${endpoint}\` threw an error: ${error.message || "Unknown error"}`,
        [{ name: "Endpoint", value: endpoint, inline: true }]
      );
    }
    throw error;
  }
});
