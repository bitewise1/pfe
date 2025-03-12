// Importation des modules nécessaires
const express = require('express'); // Framework pour créer le serveur
const app = express(); // Initialisation de l'application Express
const cors = require('cors'); // Gérer les requêtes cross-origin
const { admin, db } = require("./config/firebase"); // Importation de Firebase
const authRoutes = require("./Routes/authRoutes"); // Correction du chemin d'importation

// Charger les variables d'environnement depuis .env
require('dotenv').config(); 

//Middleware pour parser le corps de la requête
app.use(express.json());

// Activer CORS (pour permettre les requêtes de n'importe quelle origine)
app.use(cors()); 


// Route de bienvenue
app.get('/', (req, res) => {
    res.send('Bienvenue sur BiteWise!');
});

// Utilisation des routes d'authentification
app.use("/auth", authRoutes);

//Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({error: "Une erreur est survenue sur le serveur"});
});


//Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
