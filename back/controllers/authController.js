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
        
        const userSnapshot = await db.collection("users").doc(userRecord.uid).get();
        if (!userSnapshot.exists) {
            await db.collection("users").doc(userRecord.uid).set({
                email: userRecord.email,
                uid: userRecord.uid,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        res.status(200).json({ message: "Connexion réussie", uid: userRecord.uid, email: userRecord.email });
    } catch (error) {
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
        if (!idToken) return res.status(400).json({ error: "Token requis" });

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userRef = db.collection("users").doc(decodedToken.uid);
        const docSnapshot = await userRef.get();

        if (!docSnapshot.exists) {
            await userRef.set({ uid: decodedToken.uid, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        }

        res.status(200).json({ message: "Connexion réussie", uid: decodedToken.uid });
    } catch (error) {
        res.status(401).json({ error: "Erreur d'authentification" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "L'email est requis" });

        const resetLink = await admin.auth().generatePasswordResetLink(email);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Réinitialisation de votre mot de passe",
            text: `Cliquez ici pour réinitialiser votre mot de passe : ${resetLink}`,
        });

        res.json({ message: "E-mail de réinitialisation envoyé" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { login, register, socialAuth, resetPassword };
