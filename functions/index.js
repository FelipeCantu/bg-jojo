const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const sanityClient = require('@sanity/client');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Initialize Sanity Client (use your Sanity project details)
require('dotenv').config();

const client = sanityClient({
  projectId: 'wssoiuia',
  dataset: 'production',
  token: process.env.SANITY_TOKEN, // Securely loaded
  useCdn: false
});

// Set up Express app
const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Webhook handler to sync data from Sanity to Firestore
app.post('/sanity-webhook', async (req, res) => {
  try {
    const { _id, _type, ...data } = req.body;

    if (req.body._deleted) {
      // Delete document from Firestore
      await db.collection(_type).doc(_id).delete();
      console.log(`Deleted: ${_id}`);
    } else {
      // Create/Update document in Firestore
      await db.collection(_type).doc(_id).set(data, { merge: true });
      console.log(`Synced: ${_id}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error syncing:", error);
    res.status(500).json({ error: error.message });
  }
});

// Export Firebase function
exports.sanitySync = functions.https.onRequest(app);
