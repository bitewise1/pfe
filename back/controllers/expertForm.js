const { admin, db, auth } = require("../config/firebase");
const bcrypt = require("bcrypt");

// Fonction pour valider l'email
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
// Fonction pour valider le numéro de téléphone
const validatePhoneNumber = (countryCode, phoneNumber) => {
    const phoneRegex = /^\d+$/;
    return phoneRegex.test(phoneNumber);
};

// Inscription du Nutritioniste
exports.registerNutritionist = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            countryCode,
            phoneNumber,
            yearsOfExperience,
            specialization,
            workplace,
            shortBio,
        } = req.body;

        const professionalCertificate = req.files["professionalCertificate"] ? req.files["professionalCertificate"][0] : null;
        const profileImage = req.files["profileImage"] ? req.files["profileImage"][0] : null;


        // Validation des champs requis
        if (!firstName || !lastName || !email || !password || !confirmPassword || !countryCode || !phoneNumber || !yearsOfExperience || !specialization || !workplace || !shortBio || !professionalCertificate) {
            return res.status(400).json({ error: "Tous les champs sont requis." });
        }

        // Validation de l'email
        if (!validateEmail(email)) {
            return res.status(400).json({ error: "Email invalide." });
        }

        // Validation de la complexité du mot de passe
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                error: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
            });
        }

        // Validation du mot de passe
        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Les mots de passe ne correspondent pas." });
        }

        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Validation du numéro de téléphone
        if (!validatePhoneNumber(countryCode, phoneNumber)) {
            return res.status(400).json({ error: "Numéro de téléphone invalide." });
        }

        // Validation des années d'expérience
        const years = parseInt(yearsOfExperience, 10);
        if (isNaN(years) || years < 0 || years > 60) {
            return res.status(400).json({ error: "Années d'expérience invalides." });
        }

        // Validation de la spécialisation
        const validSpecializations = [
            "Clinical Nutrition",
            "Sports Nutrition",
            "Weight Management",
            "Pediatric Nutrition",
            "Digestive Health",
        ];
        if (!validSpecializations.includes(specialization)) {
            return res.status(400).json({ error: "Spécialisation invalide." });
        }

        // Validation du lieu de travail
        if (!workplace || workplace.trim() === "") {
            return res.status(400).json({ error: "Le lieu de travail est requis." });
        }

        // Validation de la courte biographie
        if (!shortBio || shortBio.trim() === "") {
            return res.status(400).json({ error: "La saisie de votre courte biographie est requise." });
        }

        // Vérification du type des fichiers téléchargés
        const allowedImageTypes = ['image/jpeg', 'image/png'];
        const allowedPdfTypes = ['application/pdf'];
        if (professionalCertificate && !allowedPdfTypes.includes(professionalCertificate.mimetype)) {
            return res.status(400).json({ error: "Le certificat professionnel doit être un fichier PDF." });
        }

        if (profileImage && !allowedImageTypes.includes(profileImage.mimetype)) {
            return res.status(400).json({ error: "L'image de profil doit être au format JPEG ou PNG." });
        }

        // Création de l'utilisateur dans Firebase Authentication
        const userRecord = await auth.createUser({
            email,
            password: hashedPassword,
            displayName: `${firstName} ${lastName}`,
        });

        const userId = userRecord.uid; // Récupérer l'ID de l'utilisateur

        // Enregistrement des informations supplémentaires dans Firestore
        await db.collection("nutritionists").doc(userId).set({
            firstName,
            lastName,
            email,
            phoneNumber: `${countryCode}${phoneNumber}`,
            yearsOfExperience,
            specialization,
            workplace,
            shortBio,
            professionalCertificate: professionalCertificate.path,
            profileImage: profileImage ? profileImage.path : null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Réponse en cas de succès
        res.status(201).json({
            message: "Nutritionniste enregistré avec succès.",
            userId,
        });
    } catch (error) {
        // Gestion des erreurs spécifiques à Firebase
        if (error.code === "auth/email-already-exists") {
            return res.status(400).json({ error: "Cet email est déjà utilisé." });
        }
        if (error.code === "auth/invalid-email") {
            return res.status(400).json({ error: "Email invalide." });
        }
        if (error.code === "auth/weak-password") {
            return res.status(400).json({ error: "Le mot de passe est trop faible." });
        }
        // Gestion des autres erreurs
        res.status(500).json({ error: error.message });
  
    }
};

