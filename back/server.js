// Importation des modules nécessaires
require("dotenv").config(); // Charger les variables d'environnement en premier
const express = require("express");
const cors = require("cors");
const firebase = require("./config/firebase"); // Firebase Config
const admin = firebase.admin;
const db = firebase.db;

const authRoutes = require("./Routes/authRoutes");
const userRoutes = require("./Routes/userRoutes");
const expertRoutes = require("./Routes/expertRoutes")
const app = express();

// Vérification de la connexion Firebase
if (!admin.apps.length) {
  console.error("Firebase Admin SDK non initialisé !");
  process.exit(1);
} else {
  console.log("Firebase Admin SDK chargé avec succès !");
}

// Middleware
app.use(express.json());
app.use(cors());

// Route de bienvenue
app.get("/", (req, res) => {
  res.send("Bienvenue sur BiteWise!");
});

// API Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/expert", expertRoutes);
// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error("Erreur Serveur :", err.stack);
  res.status(500).json({ error: "Une erreur est survenue sur le serveur." });
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
