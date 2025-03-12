const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// 🔹 Authentication Routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// 🔹 User Setup Routes
router.post("/select-mode", authController.selectMode);

// 🔹 Password Management
router.post("/reset-password", authController.resetPassword);

// 🔹 Validation Routes
router.post("/validate-email", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis" });
    try {
        const isValid = await authController.validateEmail(email);
        res.json({ isValid });
    } catch (error) {
        res.status(500).json({ error: "Erreur de validation de l'email" });
    }
});

router.post("/validate-phone", async (req, res) => {
    const { countryCode, phoneNumber } = req.body;
    if (!countryCode || !phoneNumber) return res.status(400).json({ error: "Données incomplètes" });
    try {
        const isValid = await authController.validatePhoneNumber(countryCode, phoneNumber);
        res.json({ isValid });
    } catch (error) {
        res.status(500).json({ error: "Erreur de validation du numéro de téléphone" });
    }
});

// Export Routes
module.exports = router;
