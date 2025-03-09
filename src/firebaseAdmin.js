import admin from "firebase-admin";
import serviceAccount from "./bg-jojo-firebase-adminsdk-fbsvc-c47b06fc9f.json"; // Update path

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://bg-jojo.firebaseapp.com", // Replace with your Firestore URL
  });
}

const db = admin.firestore();
export { db };
