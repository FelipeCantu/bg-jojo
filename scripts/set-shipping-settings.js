/**
 * One-time script to set shipping settings in Firestore.
 * Run with: node scripts/set-shipping-settings.js
 *
 * Requires Firebase Admin SDK credentials. Either:
 *   - Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account JSON path, OR
 *   - Run `firebase login` and use application default credentials
 */

const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "bg-jojo",
});

const db = admin.firestore();

async function main() {
  await db.collection("settings").doc("shipping").set({
    enabled: true,
    flatRate: 8.99,
    freeShippingThreshold: null,
    currency: "usd",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: "admin-script",
  });

  console.log("Shipping settings saved successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error saving shipping settings:", err);
  process.exit(1);
});
