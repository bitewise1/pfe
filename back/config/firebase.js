require("dotenv").config();
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Get Firebase service account file path from .env
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

// Debugging: Print the path to confirm it's correct
console.log("Checking Firebase JSON Path:", serviceAccountPath);

// Check if the file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Firebase service account file is missing or incorrect:", serviceAccountPath);
  process.exit(1); // Stop the server if the file is missing
}

// ✅ Load service account credentials
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath); // Try to load service account credentials
} catch (error) {
  console.error("Failed to load the service account credentials file:", error);
  process.exit(1);
}

// Initialize Firebase Admin SDK only if it is not initialized yet
if (!admin.apps.length) {
  try {
    console.log("Initializing Firebase Admin SDK...");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,  // Optional, only if you're using Firebase Realtime Database
    });
    console.log("Firebase connected to project:", process.env.FIREBASE_PROJECT_ID);
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
    process.exit(1); // Stop the server if initialization fails
  }
}

// Initialize Firestore and Auth
const db = admin.firestore();
const auth = admin.auth();

console.log("Firebase Firestore and Auth initialized successfully!");

// Export Firebase services for use in other files
module.exports = { db, admin, auth };

