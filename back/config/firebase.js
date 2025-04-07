// config/firebase.js
require("dotenv").config(); // Load .env variables
const admin = require("firebase-admin");
const fs = require("fs");
const path = require('path'); // Use path module for robustness

// Object to hold initialized instances
const firebaseInstances = {
  admin: null,
  db: null,
  auth: null,
  _initializationError: null // Store potential error
};

// Perform Initialization Immediately & Synchronously
try {
  // Check if already initialized (safety check)
  if (admin.apps.length > 0) {
    console.log("[Firebase Sync Init] SDK already initialized.");
    firebaseInstances.admin = admin;
    firebaseInstances.db = admin.firestore();
    firebaseInstances.auth = admin.auth();
  } else {
    // Get path from environment variable
    const serviceAccountRelativePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    console.log("[Firebase Sync Init] Path from .env:", serviceAccountRelativePath);

    if (!serviceAccountRelativePath) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not defined.");
    }

    // Resolve the path relative to the project root (where server.js is likely run)
    // __dirname here refers to the 'config' directory, so go up one level '../'
    // Adjust '../' if your config folder is nested differently relative to project root
    const serviceAccountAbsolutePath = path.resolve(__dirname, '../', serviceAccountRelativePath);
    console.log("[Firebase Sync Init] Attempting to resolve absolute path:", serviceAccountAbsolutePath);


    if (!fs.existsSync(serviceAccountAbsolutePath)) {
      throw new Error(`Service account file missing at resolved path: ${serviceAccountAbsolutePath}`);
    }

    // Read and parse synchronously
    const serviceAccountJson = fs.readFileSync(serviceAccountAbsolutePath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log("[Firebase Sync Init] Service account loaded for project:", serviceAccount.project_id);

    // Initialize synchronously
    console.log("[Firebase Sync Init] Initializing SDK...");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL, // Make sure this is in .env
    });

    // Assign instances immediately after sync initializeApp returns
    firebaseInstances.admin = admin;
    firebaseInstances.db = admin.firestore();
    firebaseInstances.auth = admin.auth();

    console.log("[Firebase Sync Init] SDK Initialized & Instances Assigned Successfully.");
  }

} catch (error) {
  // Catch ANY error during the sync initialization block
  console.error("!!! [Firebase Sync Init] Initialization Failed:", error.message); // Log just the message for clarity first
  console.error("!!! Full Error Stack:", error.stack); // Log stack for details
  firebaseInstances._initializationError = error; // Store the error for checking in server.js
}

// Export the object containing the instances (or nulls if failed)
module.exports = {
    firebaseInstances
};