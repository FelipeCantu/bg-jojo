const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret_key);
const express = require("express");
const cors = require("cors");
const app = express();

// Initialize Firebase Admin
admin.initializeApp();

// Enable CORS for all origins (you can restrict this to specific origins if needed)
app.use(cors({ origin: true }));

// Middleware to parse the body
app.use(express.json());

// Create PaymentIntent
app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body; // Amount should be in cents (e.g., $10)

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      metadata: { integration_check: "accept_a_payment" },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);
    res.status(500).send({ error: error.message });
  }
});

// Webhook for Stripe events
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = functions.config().stripe.webhook_secret;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        // Handle successful payment
        await handleSuccessfulPayment(paymentIntent);
        break;
      }
      case "payment_intent.payment_failed": {
        const failedPayment = event.data.object;
        // Handle failed payment
        await handleFailedPayment(failedPayment);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(400).send(`Webhook error: ${err.message}`);
  }
});

/**
 * Handles successful payments
 * @param {object} paymentIntent - The Stripe payment intent object
 */
async function handleSuccessfulPayment(paymentIntent) {
  const { id, amount_received: amountReceived, metadata } = paymentIntent;
  const amountInDollars = (amountReceived / 100).toFixed(2);

  try {
    console.log("Payment succeeded", { paymentId: id, amount: amountInDollars });

    if (metadata.orderId) {
      const db = admin.firestore();
      await db.collection("orders").doc(metadata.orderId).update({
        status: "paid",
        paymentId: id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Order ${metadata.orderId} updated to paid`);
    }
  } catch (error) {
    console.error("Failed to process payment", { paymentId: id, error: error.message });
  }
}

/**
 * Handles failed payments
 * @param {object} paymentIntent - The Stripe payment intent object
 */
async function handleFailedPayment(paymentIntent) {
  const { id, last_payment_error: lastPaymentError, metadata } = paymentIntent;

  try {
    console.error("Payment failed", { paymentId: id, error: lastPaymentError });

    if (metadata.orderId) {
      const db = admin.firestore();
      await db.collection("orders").doc(metadata.orderId).update({
        status: "failed",
        paymentError: lastPaymentError?.message || "Payment failed",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Order ${metadata.orderId} updated to failed`);
    }
  } catch (error) {
    console.error("Failed to process failed payment", { paymentId: id, error: error.message });
  }
}

// Export functions
exports.api = functions.https.onRequest(app);
