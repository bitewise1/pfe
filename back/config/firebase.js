require("dotenv").config();
const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
console.log("Checking Firebase JSON Path:", serviceAccountPath);

// Check file
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Firebase service account file is missing:", serviceAccountPath);
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error("Failed to load Firebase credentials:", error);
  process.exit(1);
}

if (!admin.apps.length) {
  try {
    console.log("Initializing Firebase Admin SDK...");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    console.log("Firebase connected to project:", process.env.FIREBASE_PROJECT_ID);
  } catch (error) {
    console.error("Firebase init error:", error);
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();

console.log("Firebase Firestore and Auth initialized successfully!");

module.exports = { admin, db, auth };
