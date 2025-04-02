const { admin, db } = require("../config/firebase");
const bcrypt = require("bcrypt");
const transporter = require("../config/nodemailer");
const { validateEmail } = require("../utils/validators");

const login = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: "Token requis" });

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userRecord = await admin.auth().getUser(decodedToken.uid);

        const userRef = db.collection("users").doc(userRecord.uid);
        let userSnapshot = await userRef.get();

        if (!userSnapshot.exists) {
            await userRef.set({
                email: userRecord.email,
                uid: userRecord.uid,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            userSnapshot = await userRef.get(); // refresh snapshot
        }

        const userData = userSnapshot.data();
        res.status(200).json({ message: "Connexion réussie", user: userData });

    } catch (error) {
        console.error("Login error:", error);
        res.status(401).json({ error: "Token invalide ou expiré" });
    }
};


const register = async (req, res) => {
    try {
        const { email, password, userType } = req.body;
        if (!email || !password || !userType) return res.status(400).json({ error: "All fields are required" });

        const existingUserRef = db.collection("users").where("email", "==", email);
        const existingUserSnapshot = await existingUserRef.get();
        
        existingUserSnapshot.forEach(async (doc) => await db.collection("users").doc(doc.id).delete());

        const userRecord = await admin.auth().createUser({ email, password });

        await db.collection("users").doc(userRecord.uid).set({
            email,
            uid: userRecord.uid,
            userType,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(201).json({ message: "User sign up successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const socialAuth = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: "Token is required" });

        // Verify ID Token (Google or Facebook)
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const email = decodedToken.email;

        if (!email) {
            return res.status(400).json({ error: "Email not provided in token" });
        }

        // Check if user exists in Firestore
        const userRef = db.collection("users").doc(uid);
        const docSnapshot = await userRef.get();

        if (!docSnapshot.exists) {
            // Create new user if not found
            await userRef.set({
                uid,
                email,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        res.status(200).json({ message: "Login successful", uid, email });
    } catch (error) {
        console.error("Firebase Auth Error:", error);
        res.status(401).json({ error: "Invalid or expired token" });
    }
};



module.exports = { login, register, socialAuth };
