// Modified Firebase Function to handle callable functions properly
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const Stripe = require("stripe");
const crypto = require("crypto");

// Security recommendation: Validate environment in local emulator
if (process.env.FUNCTIONS_EMULATOR === "true") {
  require("dotenv").config();
  console.log("Running in local emulator mode");

  // Validate required environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ Missing STRIPE_SECRET_KEY in environment variables");
    process.exit(1);
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
          await db.collection("donations").doc(pi.metadata.donationId).update({
            status: "paid",
            stripePaymentIntentId: pi.id,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else if (pi.metadata?.orderId) {
          await db.collection("orders").doc(pi.metadata.orderId).update({
            status: "paid",
            paymentId: pi.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
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
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.metadata?.type === "donation" && session.metadata?.donationId) {
          const updateData = {
            status: session.mode === "subscription" ? "active" : "paid",
            stripeSessionId: session.id,
            stripeCustomerId: session.customer || null,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          if (session.subscription) {
            updateData.stripeSubscriptionId = session.subscription;
          }
          await db.collection("donations").doc(session.metadata.donationId).update(updateData);
        } else if (session.metadata?.orderId) {
          await db.collection("orders").doc(session.metadata.orderId).update({
            status: "paid",
            paymentId: session.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
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
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        if (subscription.metadata?.type === "donation" && subscription.metadata?.donationId) {
          await db.collection("donations").doc(subscription.metadata.donationId).update({
            status: "cancelled",
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;
        if (paymentIntentId) {
          const ordersSnap = await db.collection("orders")
            .where("paymentId", "==", paymentIntentId)
            .limit(1)
            .get();
          if (!ordersSnap.empty) {
            await ordersSnap.docs[0].ref.update({
              status: "refunded",
              refundedAt: admin.firestore.FieldValue.serverTimestamp(),
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

/**
 * Root endpoint that returns API status information
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
app.get("/", (req, res) => {
  if (!stripe) stripe = initializeStripe();

  const stripeMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ? "test" : "live";

  res.json({
    status: "API is running",
    environment: process.env.K_SERVICE ? "production" : "development",
    stripe: stripe ? "ready" : "not configured",
    stripeMode,
    endpoints: {
      payment: "POST /createPaymentIntent",
      checkout: "POST /createCheckoutSession",
      donationPayment: "POST /createDonationPaymentIntent (callable)",
      donationCheckout: "POST /createDonationCheckoutSession (callable)",
      webhook: "POST /webhook",
    },
  });
});

/**
 * Creates a Stripe Payment Intent
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
app.post("/createPaymentIntent", async (req, res) => {
  try {
    if (!stripe) stripe = initializeStripe();
    if (!stripe) throw new Error("Payment service unavailable");

    const { amount, currency = "usd", metadata = {}, receipt_email } = req.body;

    if (!amount || isNaN(amount) || amount < 50) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const intentParams = {
      amount: Math.round(amount),
      currency,
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

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error("Payment error:", error);
    const userMessage = error.type === "StripeCardError" ?
      error.message :
      "Payment processing failed. Please try again.";
    res.status(500).json({
      error: userMessage,
      code: error.code || "payment_error",
    });
  }
});

/**
 * Creates a Stripe Checkout Session
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
app.post("/createCheckoutSession", async (req, res) => {
  try {
    if (!stripe) stripe = initializeStripe();
    if (!stripe) throw new Error("Payment service unavailable");

    const { lineItems, successUrl, cancelUrl, customerEmail } = req.body;

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
      return res.status(400).json({ error: "Invalid URL domain" });
    }

    const { metadata = {} } = req.body;

    const idempotencyKey = metadata.orderId ?
      `cs_order_${metadata.orderId}` :
      `cs_${crypto.randomUUID()}`;

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata,
        expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
      },
      { idempotencyKey }
    );

    res.json({
      sessionId: session.id,
      url: session.url,
      expires: session.expires_at,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({
      error: "Checkout session creation failed. Please try again.",
      code: error.code || "checkout_error",
    });
  }
});

// Error handling for the Express app
app.use((err, req, res, _next) => { // Prefix unused parameter with underscore
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Export the HTTP API function (webhook + REST endpoints)
exports.httpApi = onRequest({
  minInstances: CONFIG.minInstances,
  invoker: "public",
  cors: true,
  secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
}, app);

/**
 * Callable function for Firebase SDK
 * @param {object} request The callable request object
 * @returns {object} Response data
 * @throws {Error} If payment service is unavailable or invalid request
 */
exports.api = onCall({
  secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
}, async request => {
  // Initialize Stripe if not already done
  if (!stripe) stripe = initializeStripe();
  if (!stripe) throw new Error("Payment service unavailable");

  // Get the endpoint from request data
  const { endpoint, ...data } = request.data;

  // Create Payment Intent
  if (endpoint === "createPaymentIntent") {
    const { amount, currency = "usd", metadata = {}, receipt_email } = data;

    if (!amount || isNaN(amount) || amount < 50) {
      throw new Error("Invalid amount");
    }

    const intentParams = {
      amount: Math.round(amount),
      currency,
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
    const { lineItems, successUrl, cancelUrl, customerEmail, metadata = {} } = data;

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

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata,
        expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
      },
      { idempotencyKey }
    );

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

    if (sessionId) {
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
    } else {
      updateData.status = donation.frequency === "monthly" ? "active" : "paid";
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
      throw new HttpsError("internal", `Refund failed: ${stripeError.message}`);
    }

    await orderRef.update({
      status: "refunded",
      refundAmount: order.refundAmount || order.total,
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

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
    if (orderIds.length > 500) {
      throw new HttpsError("invalid-argument", "Cannot archive more than 500 orders at once");
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

  throw new Error(`Unknown endpoint: ${endpoint}`);
});
