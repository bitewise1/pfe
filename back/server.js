// server.js
require("dotenv").config(); // MUST BE ABSOLUTE FIRST LINE
console.log("ENV Check - Service Account Path from .env:", process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

const express = require("express");
const cors = require("cors");

// Require the config file - this runs the synchronous initialization code inside it NOW
const { firebaseInstances } = require("./config/firebase");

// --- !!! STRICT CHECK IMMEDIATELY AFTER REQUIRE !!! ---
if (firebaseInstances._initializationError || !firebaseInstances.db || !firebaseInstances.auth || !firebaseInstances.admin) {
   console.error("---------------------------------------------------------");
   console.error("CRITICAL: Server cannot start due to Firebase initialization failure.");
   if(firebaseInstances._initializationError) {
       console.error("Initialization Error Details:", firebaseInstances._initializationError.message);
   } else {
       console.error("Reason: One or more Firebase instances (db, auth, admin) are null after initialization attempt.");
   }
   console.error("Please check console logs above for specific Firebase Init errors,");
   console.error("verify .env path, and service account key file validity.");
   console.error("---------------------------------------------------------");
   process.exit(1); // HARD EXIT - Do not proceed if Firebase isn't ready
}
// --- End Strict Check ---

// If we reached here, Firebase seems okay.
console.log("Firebase initialization check passed in server.js. DB/Auth/Admin should be available.");

// --- Import routes (they can now safely require config/firebase) ---
const authRoutes = require("./Routes/authRoutes");
const userRoutes = require("./Routes/userRoutes");
const expertRoutes = require("./Routes/expertRoutes"); // Assuming this exists
const nutritionPlanRoutes = require("./Routes/nutritionPlanRoutes");
const recipesRoutes = require('./Routes/recipesRoutes');
const logMealRoutes = require('./Routes/logMealRoutes'); // Use correct variable name if different
const profileRoutes = require('./Routes/profileRoutes');
const coachingRoutes = require('./Routes/coachingRoutes');

const app = express();

// --- Middleware ---
app.use(express.json());
app.use(cors());

// --- Basic Route ---
app.get("/", (req, res) => {
  res.send("Bienvenue sur BiteWise!");
});

// --- Mount Routes ---
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/expert", expertRoutes); // Assuming this exists
app.use("/nutritionPlan", nutritionPlanRoutes);
app.use('/recipes', recipesRoutes);
app.use('/logMeal', logMealRoutes); 
app.use('/user', profileRoutes); 
app.use('/coaching', coachingRoutes);
// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error("Unhandled Route Error:", err.stack);
  res.status(500).json({ error: "Une erreur interne est survenue sur le serveur." });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}. Firebase connection verified.`);
  console.log(`Backend URL appears to be: ${process.env.BACKEND_URL || 'Not Set'}`); // Log backend URL
});