// controllers/authController.js

// Import the object holding the instances
const { firebaseInstances } = require('../config/firebase');
// Access admin, auth, and db via the firebaseInstances object
const admin = firebaseInstances.admin;
const auth = firebaseInstances.auth;
const db = firebaseInstances.db;

// Note: bcrypt, transporter, validateEmail imports remain the same
const bcrypt = require("bcrypt"); // Assuming bcrypt is used elsewhere or intended
const transporter = require("../config/nodemailer"); // Assuming nodemailer setup exists
const { validateEmail } = require("../utils/validators"); // Assuming validator utils exist

// --- Helper function for safety checks ---
function checkAuthFirebaseInitialized(res, checkDb = true, checkAuth = true) {
    let missing = [];
    if (!admin) missing.push("Admin");
    if (checkAuth && !auth) missing.push("Auth");
    if (checkDb && !db) missing.push("DB");

    if (missing.length > 0) {
        console.error(`FATAL: Firebase service(s) not initialized when trying to access auth routes: ${missing.join(', ')}`);
        res.status(500).json({ error: "Server configuration error (Auth). Please try again later." });
        return false; // Indicates failure
    }
    return true; // Indicates success
}

const login = async (req, res) => {
    // Safety Check
    if (!checkAuthFirebaseInitialized(res, true, true)) return; // Needs db, auth, admin

    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: "Token requis" });

        // Use the imported auth instance
        const decodedToken = await auth.verifyIdToken(idToken);
        const userRecord = await auth.getUser(decodedToken.uid);

        // Use the imported db instance
        const userRef = db.collection("users").doc(userRecord.uid);
        let userSnapshot = await userRef.get();

        if (!userSnapshot.exists) {
            console.log(`Creating user entry during login for UID: ${userRecord.uid}`);
            await userRef.set({
                email: userRecord.email,
                uid: userRecord.uid,
                createdAt: admin.firestore.FieldValue.serverTimestamp(), // Use admin instance for FieldValue
            });
            userSnapshot = await userRef.get(); // refresh snapshot
        }

        const userData = userSnapshot.data();
        res.status(200).json({ message: "Connexion réussie", user: userData });

    } catch (error) {
        console.error("Login error:", error);
        if (error.code?.startsWith('auth/')) {
             res.status(401).json({ error: "Token invalide ou expiré" });
        } else {
             res.status(500).json({ error: "Erreur interne du serveur lors de la connexion." });
        }
    }
};


const register = async (req, res) => {
    // Safety Check
    if (!checkAuthFirebaseInitialized(res, true, true)) return; // Needs db, auth, admin

    try {
        const { email, password, userType } = req.body;
        if (!email || !password || !userType) return res.status(400).json({ error: "All fields are required" });

        // Optional: Validate email format
        if (!validateEmail(email)) {
             return res.status(400).json({ error: "Invalid email format" });
        }

        // Use db instance to check for existing user by email before creating auth user
        // This avoids deleting potentially valid users if auth.createUser fails later
        const existingUserQuery = db.collection("users").where("email", "==", email);
        const existingUserSnapshot = await existingUserQuery.get();

        if (!existingUserSnapshot.empty) {
             // Decide how to handle: maybe inform user email exists, or attempt login?
             // For now, return conflict
             console.warn(`Registration attempt failed: Email ${email} already exists in Firestore.`);
             return res.status(409).json({ error: "Email already associated with an account in database." });
             // If you MUST delete, ensure it's the right logic. The previous delete logic was risky.
        }

        // Use auth instance
        console.log(`Creating auth user for ${email}`);
        const userRecord = await auth.createUser({ email, password });
        console.log(`Auth user created successfully: ${userRecord.uid}`);

        // Use db instance
        console.log(`Creating Firestore user doc for ${userRecord.uid}`);
        await db.collection("users").doc(userRecord.uid).set({
            email,
            uid: userRecord.uid,
            userType,
            createdAt: admin.firestore.FieldValue.serverTimestamp(), // Use admin instance
        });

        res.status(201).json({ message: "User sign up successfully", uid: userRecord.uid });
    } catch (error) {
         console.error("Registration error:", error);
         if (error.code === 'auth/email-already-exists') {
              // This means it exists in Firebase Auth (maybe deleted from Firestore?)
              return res.status(409).json({ error: "The email address is already registered with Firebase Authentication." });
         } else if (error.code === 'auth/invalid-password') {
              return res.status(400).json({ error: "Password must be at least 6 characters long." });
         }
        res.status(500).json({ error: error.message || "Failed to register user." });
    }
};

const socialAuth = async (req, res) => {
    // Safety Check
    if (!checkAuthFirebaseInitialized(res, true, true)) return; // Needs db, auth, admin

    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: "Token is required" });

        // Verify ID Token - Use auth instance
        console.log("Verifying social auth ID token...");
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const email = decodedToken.email;
        console.log(`Token verified for UID: ${uid}, Email: ${email}`);

        if (!email) {
            // This case might happen with some providers (e.g., phone auth token mistakenly sent here)
            console.error("Social Auth Error: Email not found in token for UID:", uid);
            return res.status(400).json({ error: "Email not provided in token" });
        }

        // Check if user exists in Firestore - Use db instance
        const userRef = db.collection("users").doc(uid);
        const docSnapshot = await userRef.get();

        if (!docSnapshot.exists) {
            console.log(`Creating new user entry for social auth UID: ${uid}, Email: ${email}`);
            await userRef.set({
                uid,
                email,
                // You might want to add other default fields here if needed
                createdAt: admin.firestore.FieldValue.serverTimestamp(), // Use admin instance
            });
        } else {
             console.log(`User found during social auth for UID: ${uid}, Email: ${email}`);
             // Optional: Update existing user data if needed (e.g., profile picture)
        }

        res.status(200).json({ message: "Login successful", uid, email });
    } catch (error) {
        console.error("Firebase Social Auth Error:", error);
         if (error.code?.startsWith('auth/')) {
            res.status(401).json({ error: "Invalid or expired token" });
         } else {
            res.status(500).json({ error: "Internal server error during social login." });
         }
    }
};

module.exports = { login, register, socialAuth };