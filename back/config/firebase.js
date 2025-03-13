const admin = require("firebase-admin");

// Charger le fichier `serviceAccountKey.json`
const serviceAccount = require("./bitewise-4d93e-firebase-adminsdk-fbsvc-b20ed2ebb5.json"); 

// Initialisation de Firebase Admin SDK
if (!admin.apps.length) {
  try {
    console.log(" Initialisation de Firebase Admin SDK...");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log("Firebase connecté au projet :", serviceAccount.project_id);
  } catch (error) {
    console.error("Erreur d'initialisation Firebase :", error);
    process.exit(1); // Quitte l'application en cas d'erreur critique
  }
}

// Initialisation de Firestore et Auth
const db = admin.firestore();
const auth = admin.auth();

console.log("Firebase Firestore et Auth initialisés avec succès !");


module.exports = { db, admin, auth };
