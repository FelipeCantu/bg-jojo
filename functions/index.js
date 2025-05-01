const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const Stripe = require("stripe");

// Configuration
const CONFIG = {
  port: process.env.PORT || 8080,
  region: "us-central1",
  timeoutSeconds: 300,
  memory: "1GiB",
  minInstances: 1,
  maxInstances: 10,
};

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Initializes Firebase Admin SDK
 * @returns {admin.firestore.Firestore} Firestore instance
 * @throws {Error} If initialization fails
 */
function initializeFirebase() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`,
      });
      console.log("✅ Firebase Admin initialized successfully");
    } catch (error) {
      console.error("❌ Firebase Admin initialization failed:", error);
      throw error;
    }
  }
  return admin.firestore();
}

/**
 * Initializes Stripe SDK
 * @returns {Stripe} Stripe instance
 * @throws {Error} If initialization fails
 */
function initializeStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY ||
    require("firebase-functions").config().stripe.secret_key;

  if (!stripeSecretKey) {
    throw new Error("Stripe secret key not configured");
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-04-10",
    });
    console.log("💳 Stripe initialized successfully");
    return stripe;
  } catch (error) {
    console.error("❌ Stripe initialization failed:", error);
    throw error;
  }
}

/**
 * Creates and configures Express application
 * @param {admin.firestore.Firestore} db Firestore instance
 * @param {Stripe} stripe Stripe instance
 * @returns {express.Application} Configured Express application
 */
function createApp(db, stripe) {
  const app = express();

  // Middlewares
  app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(limiter);

  // Health endpoints
  app.get("/_ah/health", (req, res) => res.status(200).json({ status: "ready" }));
  app.get("/_ah/warmup", (req, res) => res.status(200).send("Warm"));

  // Core endpoints
  app.get("/", (req, res) => res.status(200).json({
    service: "Payment API",
    status: "running",
    version: "2.0.1",
    environment: process.env.NODE_ENV || "development",
  }));

  app.get("/health", (req, res) => res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  }));

  // Payment endpoints
  app.post("/createPaymentIntent", async (req, res) => {
    try {
      const { amount, currency = "usd", receiptEmail, metadata = {} } = req.body;

      if (!amount || isNaN(amount)) {
        return res.status(400).json({
          error: "Invalid amount",
          details: "Amount must be a valid number",
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency,
        receipt_email: receiptEmail,
        metadata: {
          ...metadata,
          service: "bg-jojo",
          environment: process.env.NODE_ENV || "development",
        },
        automatic_payment_methods: { enabled: true },
      });

      return res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        id: paymentIntent.id,
      });
    } catch (error) {
      console.error("Payment intent error:", error);
      return res.status(500).json({
        error: error.message,
        code: error.code || "payment_error",
        type: error.type || "api_error",
      });
    }
  });

  app.post("/createCheckoutSession", async (req, res) => {
    try {
      const { lineItems, customerEmail, successUrl, cancelUrl, metadata = {} } = req.body;

      if (!Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(400).json({
          error: "Invalid line items",
          details: "Must provide at least one valid line item",
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems.map(item => ({
          price: item.price,
          quantity: item.quantity || 1,
          adjustable_quantity: { enabled: false },
        })),
        mode: "payment",
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${cancelUrl}?cancelled=true`,
        customer_email: customerEmail,
        metadata: {
          ...metadata,
          service: "bg-jojo",
          created_at: new Date().toISOString(),
          environment: process.env.NODE_ENV || "development",
        },
        shipping_address_collection: {
          allowed_countries: ["US", "CA", "GB"],
        },
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
      });

      return res.json({
        success: true,
        id: session.id,
        url: session.url,
        expiresAt: session.expires_at,
      });
    } catch (error) {
      console.error("Checkout session error:", error);
      return res.status(500).json({
        error: error.message,
        code: error.code || "checkout_error",
        type: error.type || "api_error",
      });
    }
  });

  // Error handling middleware
  app.use((err, req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
    });
  });

  return app;
}

// Initialize services and start server
try {
  const db = initializeFirebase();
  const stripe = initializeStripe();
  const app = createApp(db, stripe);

  // Start standalone server when not in Firebase environment
  if (require.main === module) {
    const server = app.listen(CONFIG.port, () => {
      console.log(`🚀 Server running on port ${CONFIG.port}`);
    });
    server.on("error", error => {
      console.error("💥 Server failed to start:", error);
      process.exit(1);
    });
  }

  // Firebase Functions configuration
  setGlobalOptions({
    region: CONFIG.region,
    timeoutSeconds: CONFIG.timeoutSeconds,
    memory: CONFIG.memory,
    maxInstances: CONFIG.maxInstances,
  });

  exports.api = onRequest({
    timeoutSeconds: CONFIG.timeoutSeconds,
    memory: CONFIG.memory,
    minInstances: CONFIG.minInstances,
  }, app);
} catch (error) {
  console.error("🔥 Failed to initialize application:", error);
  process.exit(1);
}
