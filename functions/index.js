// Modified Firebase Function to handle callable functions properly
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const Stripe = require("stripe");

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

// Create Express app for HTTP endpoints
const app = express();

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://bg-jojo.web.app",
      "https://bg-jojo.firebaseapp.com",
      "https://givebackjojo.org",
    ];

    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
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

  res.json({
    status: "API is running",
    environment: process.env.K_SERVICE ? "production" : "development",
    stripe: stripe ? "ready" : "not configured",
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

    const { amount, currency = "usd", metadata = {} } = req.body;

    if (!amount || isNaN(amount) || amount < 50) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({
      error: error.message,
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
    const allowedDomains = ["bg-jojo.web.app", "bg-jojo.firebaseapp.com", "localhost", "givebackjojo.org"];
    const isValidUrl = url => allowedDomains.some(domain => url.includes(domain));

    if (!isValidUrl(successUrl) || !isValidUrl(cancelUrl)) {
      return res.status(400).json({ error: "Invalid URL domain" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
    });

    res.json({
      sessionId: session.id,
      url: session.url,
      expires: session.expires_at,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({
      error: error.message,
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
    const { amount, currency = "usd", metadata = {} } = data;

    if (!amount || isNaN(amount) || amount < 50) {
      throw new Error("Invalid amount");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  }

  // Create Checkout Session
  if (endpoint === "createCheckoutSession") {
    const { lineItems, successUrl, cancelUrl, customerEmail } = data;

    // Validate URLs are from allowed domains
    const allowedDomains = ["bg-jojo.web.app", "bg-jojo.firebaseapp.com", "localhost", "givebackjojo.org"];
    const isValidUrl = url => allowedDomains.some(domain => url.includes(domain));

    if (!isValidUrl(successUrl) || !isValidUrl(cancelUrl)) {
      throw new Error("Invalid URL domain");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
    });

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

    const paymentIntent = await stripe.paymentIntents.create({
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
    });

    await donationRef.update({ stripePaymentIntentId: paymentIntent.id });

    return {
      clientSecret: paymentIntent.client_secret,
      donationId: donationRef.id,
    };
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

    const allowedDomains = ["bg-jojo.web.app", "bg-jojo.firebaseapp.com", "localhost", "givebackjojo.org"];
    const isValidUrl = url => allowedDomains.some(domain => url.includes(domain));

    if (!isValidUrl(successUrl) || !isValidUrl(cancelUrl)) {
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
      const price = await stripe.prices.create({
        unit_amount: Math.round(amountCents), // eslint-disable-line camelcase
        currency,
        recurring: { interval: "month" },
        product_data: { // eslint-disable-line camelcase
          name: `Monthly Donation - $${(amountCents / 100).toFixed(2)}`,
          metadata: { type: "donation", donationId: donationRef.id },
        },
      });

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

    const session = await stripe.checkout.sessions.create(sessionParams);

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
      donation.stripeSubscriptionId
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

  throw new Error(`Unknown endpoint: ${endpoint}`);
});
