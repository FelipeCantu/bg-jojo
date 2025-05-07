const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const Stripe = require("stripe");

// Configuration
const CONFIG = {
  region: "us-central1",
  timeoutSeconds: 60,
  memory: "1GiB",
  minInstances: 0,
  maxInstances: 10,
};

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Stripe with error handling
let stripe;
try {
  const stripeConfig = require("firebase-functions").config().stripe;
  if (!stripeConfig?.secret_key) {
    throw new Error("Stripe secret key not configured in Firebase functions config");
  }
  stripe = new Stripe(stripeConfig.secret_key, {
    apiVersion: "2024-04-10",
  });
  console.log("✅ Stripe initialized successfully");
} catch (error) {
  console.error("❌ Stripe initialization failed:", error.message);
  process.exit(1);
}

// Create Express app
const app = express();

// Middleware Configuration
app.use(cors({ origin: true })); // Allows all origins
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
}));

// ======================
// API Endpoints
// ======================

// Health Check Endpoint (Required for Cloud Run)
app.get("/healthz", (req, res) => res.status(200).send("OK"));

// API Root Endpoint
app.get("/", (req, res) => {
  res.json({
    status: "API is running",
    version: "2.0",
    endpoints: {
      paymentIntent: "POST /createPaymentIntent",
      checkoutSession: "POST /createCheckoutSession",
      healthCheck: "GET /healthz",
    },
  });
});

// Create Payment Intent
app.post("/createPaymentIntent", async (req, res) => {
  try {
    const { amount, currency = "usd" } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({
      error: error.message,
      code: error.code || "payment_error",
    });
  }
});

// Create Checkout Session
app.post("/createCheckoutSession", async (req, res) => {
  try {
    const { lineItems, successUrl, cancelUrl } = req.body;

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: "Invalid line items" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({
      error: error.message,
      code: error.code || "checkout_error",
    });
  }
});

// Error Handling Middleware
app.use((err, req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ======================
// Firebase Configuration
// ======================
setGlobalOptions({
  region: CONFIG.region,
  timeoutSeconds: CONFIG.timeoutSeconds,
  memory: CONFIG.memory,
  maxInstances: CONFIG.maxInstances,
});

exports.api = onRequest({
  minInstances: CONFIG.minInstances,
  invoker: "public",
}, app);
