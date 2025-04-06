const { db } = require('../config/firebase');
const axios = require('axios');
require('dotenv').config();  


const fetchRecipes = async (req, res) => {
  try {
    const { uid, dietaryPreferences, dailyCalories, proteinGoal, carbsGoal } = req.body;

  
    const removeEmojis = (text) => {
      return text.replace(/[^\w\s,]/g, '');  // Removes emojies
    };

    // Default dietaryPreferences as an empty array if not provided
    let dietaryPreferencesString = '';
    if (Array.isArray(dietaryPreferences) && dietaryPreferences.length > 0) {
      dietaryPreferencesString = dietaryPreferences
        .map((pref) => removeEmojis(pref))
        .join(',');
    }

    // Build the API URL
    let apiUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=0d9630af29e34b23bb2b830cdbe233f4&number=10`;

    // Add query parameters only if the values are valid
    if (dailyCalories) {
      apiUrl += `&maxCalories=${dailyCalories}`;
    }
    if (proteinGoal) {
      apiUrl += `&maxProtein=${proteinGoal}`;
    }
    if (carbsGoal) {
      apiUrl += `&maxCarbs=${carbsGoal}`;
    }
    if (dietaryPreferencesString) {
      apiUrl += `&diet=${dietaryPreferencesString}`;
    }

    console.log("Spoonacular API URL:", apiUrl);  

    // request to spponacular
    const response = await axios.get(apiUrl);

   
    const recipes = response.data.results;
    if (recipes.length > 0) {
      res.status(200).json(recipes);  //send it back to the front
    } else {
      res.status(404).json({ message: "No recipes found" });
    }
  } catch (error) {
    console.error("Error fetching recipes from Spoonacular:", error);
   
    if (error.response) {
      console.error("Error response:", error.response.data);
      console.error("Error status:", error.response.status);
    }
    res.status(500).json({
      error: "Error fetching recipes from Spoonacular",
      details: error.message,
    });
  }
};

module.exports = {
  fetchRecipes,
};
