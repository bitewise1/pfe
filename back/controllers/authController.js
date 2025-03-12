const { admin, db } = require("../config/firebase");
const bcrypt = require("bcrypt");
const { parsePhoneNumberFromString } = require("libphonenumber-js");
const transporter = require("../config/nodemailer");
const { MODES } = require("../config/constants");

// Validate Email Format
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Validate Phone Number
const validatePhoneNumber = (countryCode, phoneNumber) => {
    const fullNumber = countryCode + phoneNumber;
    const parsedNumber = parsePhoneNumberFromString(fullNumber);
    return parsedNumber && parsedNumber.isValid();
};

// 🔹 User Login (Firebase Auth)
const login = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: "Token requis" });
        }

        // 🔹 Vérifier le token Firebase
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log("✅ Token vérifié :", decodedToken);

        // 🔹 Récupérer l'utilisateur Firebase Auth
        const userRecord = await admin.auth().getUser(decodedToken.uid);
        console.log("👤 Utilisateur Firebase :", userRecord.uid, userRecord.email);

        // 🔹 Vérifier si l'utilisateur est dans Firestore
        const userSnapshot = await db.collection("users").doc(userRecord.uid).get();

        if (!userSnapshot.exists) {
            console.log("🚨 Utilisateur non trouvé dans Firestore, ajout automatique...");

            // 🔹 Ajouter l'utilisateur dans Firestore
            await db.collection("users").doc(userRecord.uid).set({
                email: userRecord.email,
                uid: userRecord.uid,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log("✅ Utilisateur ajouté dans Firestore !");
        }

        res.status(200).json({
            message: "Connexion réussie",
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || "Utilisateur",
        });

    } catch (error) {
        console.error("❌ Erreur de connexion :", error);
        res.status(401).json({ error: "Token invalide ou expiré" });
    }
};


// 🔹 User Registration (Sign Up)
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: "Tous les champs sont requis" });
        }

        // 🔹 Créer l'utilisateur dans Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`,
        });

        console.log("✅ Utilisateur créé dans Firebase Auth :", userRecord.uid);

        // 🔹 Ajouter l'utilisateur dans Firestore (users collection)
        await db.collection("users").doc(userRecord.uid).set({
            firstName,
            lastName,
            email,
            uid: userRecord.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log("✅ Utilisateur ajouté dans Firestore :", userRecord.uid);

        res.status(201).json({ message: "Utilisateur inscrit avec succès", user: userRecord });
    } catch (error) {
        if (error.code === "auth/email-already-exists") {
            return res.status(400).json({ error: "Email déjà utilisé" });
        }
        console.error("❌ Erreur d'inscription :", error);
        res.status(500).json({ error: error.message });
    }
};


// 🔹 Select User Mode
const selectMode = async (req, res) => {
    try {
        const { userId, selectedMode } = req.body;
        if (!userId || !selectedMode) return res.status(400).json({ error: "Mode requis" });

        if (!MODES.includes(selectedMode)) {
            return res.status(400).json({ error: "Mode invalide" });
        }

        const userRef = db.collection("users").doc(userId);
        await userRef.update({ mode: selectedMode });

        res.status(200).json({ message: "Mode sélectionné", mode: selectedMode });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔹 Logout (Record to Firestore)
const logout = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "userId est requis" });

        await db.collection("logoutlogs").doc().set({
            userId,
            loggedOutAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({ message: "Déconnexion réussie" });
    } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
        res.status(500).json({ error: error.message });
    }
};

// 🔹 Password Reset
const resetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "L'email est requis" });

        const resetLink = await admin.auth().generatePasswordResetLink(email);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Réinitialisation de votre mot de passe",
            text: `Cliquez ici pour réinitialiser votre mot de passe : ${resetLink}`,
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "E-mail de réinitialisation envoyé" });
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            return res.status(400).json({ error: "Utilisateur non trouvé" });
        }
        res.status(500).json({ error: error.message });
    }
};

// Export functions
module.exports = {
    validateEmail,
    validatePhoneNumber,
    login,
    register,
    selectMode,
    logout,
    resetPassword,
};
