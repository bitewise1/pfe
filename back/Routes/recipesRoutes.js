const express = require('express');
const { fetchRecipes, getRecipeDetails } = require('../controllers/recipesController'); 
const router = express.Router();

// Route to fetch a list of recipes based on criteria
router.post('/fetch-recipes', fetchRecipes);

// Route to get details for a single recipe (with caching)
router.get('/details/:recipeId', getRecipeDetails);

module.exports = router;