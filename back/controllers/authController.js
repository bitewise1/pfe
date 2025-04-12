// controllers/authController.js

const { firebaseInstances } = require('../config/firebase');
// Access admin, auth, and db via the firebaseInstances object
const admin = firebaseInstances.admin; // <<<--- USE ADMIN SDK FOR VERIFICATION
// const auth = firebaseInstances.auth; // Avoid using this if it's the client SDK instance
const db = firebaseInstances.db;       // Firestore instance

// Import FieldValue from admin.firestore if not already available globally
const FieldValue = admin.firestore.FieldValue;

// Note: bcrypt, transporter, validateEmail imports remain the same if used elsewhere
// const bcrypt = require("bcrypt");
// const transporter = require("../config/nodemailer");
// const { validateEmail } = require("../utils/validators");

// --- Helper function for safety checks ---
function checkAuthFirebaseInitialized(res, checkDb = true) { // Removed checkAuth param
    let missing = [];
    // We primarily need the Admin SDK instance which includes auth() method
    if (!admin) missing.push("Admin SDK");
    if (checkDb && !db) missing.push("DB");

    if (missing.length > 0) {
        console.error(`FATAL: Firebase service(s) not initialized: ${missing.join(', ')}`);
        res.status(500).json({ error: "Server configuration error (Auth Init)." });
        return false; // Indicates failure
    }
    return true; // Indicates success
}

// --- V V V --- CORRECTED LOGIN FUNCTION --- V V V ---
const login = async (req, res) => {
    // Safety Check - Ensure Admin SDK and DB are ready
    if (!checkAuthFirebaseInitialized(res, true)) return; // Check DB, Admin SDK implies auth() exists

    try {
        // 1. Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log("Backend Login CTRL: Failed - No/Invalid Bearer token in header.");
            // Return 401 Unauthorized
            return res.status(401).json({ error: 'Token requis (Header)' });
        }
        const idToken = authHeader.split('Bearer ')[1];

        if (!idToken) {
             console.log("Backend Login CTRL: Failed - Empty token after split.");
             return res.status(401).json({ error: "Token requis (Empty)" });
        }

        // 2. Verify ID Token using Firebase ADMIN SDK
        console.log("Backend Login CTRL: Verifying ID Token with Admin SDK...");
        // Use admin.auth() which is the Admin Auth service
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid; // Get UID from verified token
        console.log(`Backend Login CTRL: Token verified successfully for UID: ${uid}`);

        // 3. Fetch user data from Firestore using the verified UID
        const userRef = db.collection("users").doc(uid);
        let userSnapshot = await userRef.get();

        // 4. Handle case where user exists in Auth but not Firestore (optional)
        if (!userSnapshot.exists) {
            console.warn(`Backend Login CTRL: Firestore document missing for verified UID: ${uid}. Creating minimal doc.`);
            // Create minimal profile if needed
            await userRef.set({
                email: decodedToken.email || `missing_${uid}@example.com`,
                uid: uid,
                createdAt: FieldValue.serverTimestamp(),
                userType: 'Personal' // Example default
            });
            userSnapshot = await userRef.get(); // Re-fetch
            if (!userSnapshot.exists) throw new Error("Failed to create user document after verification.");
        }

        // 5. Return successful response with user data
        const userData = userSnapshot.data();
        console.log("Backend Login CTRL: User data fetched, sending success response.");
        // Ensure sensitive data (like password hash if stored - shouldn't be) is removed
        // delete userData.passwordHash; // Example if you stored hashes (bad practice)
        res.status(200).json({ message: "Connexion réussie", user: userData });

    } catch (error) {
        console.error("Backend Login CTRL Error:", error);
        // Handle specific Firebase Admin Auth errors for token verification
        if (error.code === 'auth/id-token-expired') {
             return res.status(401).json({ error: "Token expiré. Veuillez vous reconnecter." });
        } else if (error.code === 'auth/argument-error' || error.code?.includes('auth/invalid-id-token')) {
             return res.status(401).json({ error: "Token invalide." });
        }
        // Handle other potential errors (Firestore read errors, etc.)
        res.status(500).json({ error: error.message || "Erreur interne du serveur lors de la connexion." });
    }
};
// --- ^ ^ ^ --- END CORRECTED LOGIN FUNCTION --- ^ ^ ^ ---


// --- Register Function ---
// Keep as is, assuming it correctly uses admin.auth().createUser() and db.collection().doc().set()
const register = async (req, res) => {
     if (!checkAuthFirebaseInitialized(res, true)) return;
     try {
         const { email, password, userType } = req.body;
         if (!email || !password || !userType) return res.status(400).json({ error: "All fields are required" });
         // if (!validateEmail(email)) { return res.status(400).json({ error: "Invalid email format" }); } // Uncomment if validator exists

         // Check Firestore first
         const existingUserQuery = db.collection("users").where("email", "==", email);
         const existingUserSnapshot = await existingUserQuery.get();
         if (!existingUserSnapshot.empty) {
              console.warn(`Registration attempt failed: Email ${email} already exists in Firestore.`);
              return res.status(409).json({ error: "Email already associated with an account." });
         }

         // Create Firebase Auth user using ADMIN SDK
         console.log(`Creating auth user for ${email}`);
         const userRecord = await admin.auth().createUser({ email, password }); // Use admin.auth()
         console.log(`Auth user created successfully: ${userRecord.uid}`);

         // Create Firestore doc
         console.log(`Creating Firestore user doc for ${userRecord.uid}`);
         await db.collection("users").doc(userRecord.uid).set({
             email, uid: userRecord.uid, userType, createdAt: FieldValue.serverTimestamp(),
         });

         res.status(201).json({ message: "User sign up successfully", uid: userRecord.uid });
     } catch (error) {
          console.error("Registration error:", error);
          if (error.code === 'auth/email-already-exists') { return res.status(409).json({ error: "Email already registered." }); }
          else if (error.code === 'auth/invalid-password') { return res.status(400).json({ error: "Password must be at least 6 characters." }); }
         res.status(500).json({ error: error.message || "Failed to register user." });
     }
 };

// --- Social Auth Function ---
// Keep as is, assuming it correctly verifies the idToken using admin.auth().verifyIdToken()
const socialAuth = async (req, res) => { /* ... your existing socialAuth logic using admin.auth().verifyIdToken ... */ };

// --- Export the corrected login function and others ---
module.exports = { login, register, socialAuth };