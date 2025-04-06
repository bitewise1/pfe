require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require('axios');
const Fuse = require('fuse.js');
const { admin, db } = require("./config/firebase"); 

const authRoutes = require("./Routes/authRoutes");
const userRoutes = require("./Routes/userRoutes");
const expertRoutes = require("./Routes/expertRoutes");
const nutritionPlanRoutes = require("./Routes/nutritionPlanRoutes");
const recipesRoutes = require('./Routes/recipesRoutes'); 
const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Bienvenue sur BiteWise!");
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/expert", expertRoutes);
app.use("/nutritionPlan", nutritionPlanRoutes);
app.use('/recipes', recipesRoutes);

app.use((err, req, res, next) => {
  console.error("Erreur Serveur :", err.stack);
  res.status(500).json({ error: "Une erreur est survenue sur le serveur." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
