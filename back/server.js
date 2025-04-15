// server.js
require("dotenv").config();
console.log("ENV Check - Service Account Path from .env:", process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

const express = require("express");
const cors = require("cors");

const { firebaseInstances } = require("./config/firebase");

// --- Strict Check (Keep this) ---
if (firebaseInstances._initializationError || !firebaseInstances.db || !firebaseInstances.auth || !firebaseInstances.admin) {
   console.error("CRITICAL: Server cannot start due to Firebase initialization failure.");
   // ... (rest of error handling) ...
   process.exit(1);
}
console.log("Firebase initialization check passed in server.js.");
// --- End Strict Check ---

// --- Import routes ---
const authRoutes = require("./Routes/authRoutes");
const userRoutes = require("./Routes/userRoutes");
const expertRoutes = require("./Routes/expertRoutes");
const nutritionPlanRoutes = require("./Routes/nutritionPlanRoutes");
const recipesRoutes = require('./Routes/recipesRoutes');
const logMealRoutes = require('./Routes/logMealRoutes');
const profileRoutes = require('./Routes/profileRoutes');
const coachingRoutes = require('./Routes/coachingRoutes');

const app = express();

// --- Middleware ---
// Apply CORS globally - this is generally safe and needed
app.use(cors());

// Apply express.json() ONLY where needed, typically *within* specific routers
// We will apply it in the route files themselves if they handle JSON bodies.
// DO NOT apply app.use(express.json()) globally here if you have multipart routes.

// --- Basic Route ---
app.get("/", (req, res) => {
  res.send("Bienvenue sur BiteWise!");
});

// --- Mount Routes ---
// Apply express.json() before routers that NEED it
app.use("/auth", express.json(), authRoutes); // Auth routes likely use JSON
app.use("/user", express.json(), userRoutes); // User routes likely use JSON
app.use("/expert", expertRoutes);
console.log("[Routes] Mounted /expert (handles its own body parsing)");
app.use("/nutritionPlan", express.json(), nutritionPlanRoutes); // Nutrition plan routes likely use JSON
app.use('/recipes', express.json(), recipesRoutes); // Recipes routes likely use JSON
app.use('/logMeal', express.json(), logMealRoutes); // logMeal routes likely use JSON
app.use('/profile', express.json(), profileRoutes); // profile routes likely use JSON
app.use('/coaching', express.json(), coachingRoutes); // coaching routes likely use JSON

// --- Error Handler (Keep this) ---
app.use((err, req, res, next) => {
  console.error("Unhandled Route Error:", err.stack);
  res.status(500).json({ error: "Une erreur interne est survenue sur le serveur." });
});

// --- Start Server (Keep this) ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => { // Explicitly listen on 0.0.0.0
  console.log(`Serveur démarré sur le port ${PORT} pour toutes les interfaces. Firebase connection verified.`);
  console.log(`Emulator should connect via http://10.0.2.2:${PORT}`);
  console.log(`Physical devices on same WiFi should connect via local IP (check ipconfig/ifconfig) on port ${PORT}`);
});