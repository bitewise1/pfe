// routes/recipesRoutes.js
const express = require('express');
const router = express.Router();
const recipesController = require('../controllers/recipesController');

// Route to fetch personalized recipes for the user
router.post('/fetch-recipes', recipesController.fetchRecipes);

module.exports = router;
