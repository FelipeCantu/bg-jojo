/**
 * One-time script to set pickup settings in Firestore.
 * Run with: node scripts/set-pickup-settings.js
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
  await db.collection("settings").doc("pickup").set({
    address: "528 N Stone Ridge Dr, Saratoga Springs, UT 84045",
    hours: "6pm – 10pm",
    instructions:
      "Text (385) 394-8018 with the day and your ETA for pickup.",
  });

  console.log("Pickup settings saved successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error saving pickup settings:", err);
  process.exit(1);
});
