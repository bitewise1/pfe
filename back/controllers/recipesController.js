// controllers/recipesController.js

// Import the object holding the instances - needed for 'db' in getRecipeDetails
const { firebaseInstances } = require('../config/firebase');
// Access db via the firebaseInstances object
const db = firebaseInstances.db;
// Access admin if FieldValue was needed (not currently used here, but good practice)
// const admin = firebaseInstances.admin;

const axios = require('axios');
require('dotenv').config(); // Ensure API key is loaded

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

if (!SPOONACULAR_API_KEY) {
    console.error("FATAL ERROR: SPOONACULAR_API_KEY is not defined in .env file.");
    // process.exit(1); // Optional: stop server if key is missing
}

// --- Helper function for safety checks (Only checks DB for getRecipeDetails) ---
function checkRecipeDbInitialized(res) {
    if (!db) {
        console.error("FATAL: Firebase DB not initialized when trying to access recipe cache.");
        res.status(500).json({ error: "Server configuration error (Recipe Cache). Please try again later." });
        return false; // Indicates failure
    }
    return true; // Indicates success
}


// --- Fetch Multiple Recipes (Does NOT need Firebase check) ---
const fetchRecipes = async (req, res) => {
    // No Firebase check needed here as it only calls Spoonacular
    try {
        let { uid, dietaryPreferences, dailyCalories, proteinGoal, carbsGoal, fatGoal, fiberGoal, searchQuery, otherDietaryText } = req.body;

        // --- Dietary Preference Mapping ---
        let apiDietParams = [];
        let apiIntoleranceParams = [];
        let apiExcludeIngredients = [];
        let nutrientFilters = {};

        const userPreferences = Array.isArray(dietaryPreferences)
            ? dietaryPreferences
            : (typeof dietaryPreferences === 'string' && dietaryPreferences.length > 0 ? dietaryPreferences.split(',') : []);

        userPreferences.forEach(pref => {
            // ... (keep the switch statement for mapping) ...
              if (!pref || typeof pref !== 'string') return;
              const cleanPref = pref.replace(/[^\w\s'-]/g, '').trim().toLowerCase();
              switch (cleanPref) {
                  case 'vegan': apiDietParams.push('vegan'); break;
                  case 'vegetarian': apiDietParams.push('vegetarian'); break;
                  case 'pescetarian': apiDietParams.push('pescetarian'); break;
                  case 'gluten free': apiDietParams.push('gluten free'); apiIntoleranceParams.push('gluten'); break;
                  case 'lactose intolerance': apiIntoleranceParams.push('dairy'); break;
                  case 'seafood or shellfish allergy': apiIntoleranceParams.push('seafood', 'shellfish'); break;
                  case 'low-sodium diet': nutrientFilters.maxSodium = 1500; break;
                  case 'diabetic-friendly diet': nutrientFilters.maxSugar = 25; break;
                  case 'religious dietary restrictions halalkosher etc': apiExcludeIngredients.push('pork'); break;
                  case 'other':
                      const otherTextLower = (otherDietaryText || '').toLowerCase();
                      if (otherTextLower.includes('peanut')) apiIntoleranceParams.push('peanut');
                      if (otherTextLower.includes('tree nut')) apiIntoleranceParams.push('tree nut');
                      if (otherTextLower.includes('egg')) apiIntoleranceParams.push('egg');
                      if (otherTextLower.includes('soy')) apiIntoleranceParams.push('soy');
                      if (otherTextLower.includes('fish') && !otherTextLower.includes('shellfish')) apiIntoleranceParams.push('fish');
                      break;
                  case 'no restrictions': default: break;
              }
        });

        apiDietParams = [...new Set(apiDietParams)];
        apiIntoleranceParams = [...new Set(apiIntoleranceParams)];
        apiExcludeIngredients = [...new Set(apiExcludeIngredients)];
        // --- END Dietary Preference Mapping ---


        // --- Build API URL ---
        let apiUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&number=12&addRecipeNutrition=true&instructionsRequired=true&fillIngredients=false`;

        if (dailyCalories && !isNaN(dailyCalories) && dailyCalories > 0) apiUrl += `&maxCalories=${dailyCalories}`;
        if (proteinGoal && !isNaN(proteinGoal) && proteinGoal > 0) apiUrl += `&maxProtein=${proteinGoal}`;
        if (carbsGoal && !isNaN(carbsGoal) && carbsGoal > 0) apiUrl += `&maxCarbs=${carbsGoal}`;
        if (fatGoal && !isNaN(fatGoal) && fatGoal > 0) apiUrl += `&maxFat=${fatGoal}`;
        if (fiberGoal && !isNaN(fiberGoal) && fiberGoal > 0) apiUrl += `&maxFiber=${fiberGoal}`;
        if (nutrientFilters.maxSodium) apiUrl += `&maxSodium=${nutrientFilters.maxSodium}`;
        if (nutrientFilters.maxSugar) apiUrl += `&maxSugar=${nutrientFilters.maxSugar}`;
        if (apiDietParams.length > 0) apiUrl += `&diet=${apiDietParams.join(',')}`;
        if (apiIntoleranceParams.length > 0) apiUrl += `&intolerances=${apiIntoleranceParams.join(',')}`;
        if (apiExcludeIngredients.length > 0) apiUrl += `&excludeIngredients=${apiExcludeIngredients.join(',')}`;
        if (searchQuery) {
            apiUrl += `&query=${encodeURIComponent(searchQuery)}`;
        }

        console.log("Mapped Dietary Params:", { diets: apiDietParams, intolerances: apiIntoleranceParams, excludes: apiExcludeIngredients });
        console.log("Calling Spoonacular URL for fetchRecipes:", apiUrl);

        const response = await axios.get(apiUrl);
        const recipes = response.data.results || [];
        console.log(`Found ${recipes.length} recipes from Spoonacular.`);

        const recipesWithNutrition = recipes.filter(r => r.nutrition?.nutrients?.length > 0);
        console.log(`Found ${recipesWithNutrition.length} recipes with basic nutrition info.`);

        res.status(200).json(recipesWithNutrition.length > 0 ? recipesWithNutrition : recipes);

    } catch (error) {
        console.error("Error in fetchRecipes:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        // Check for specific Spoonacular errors if needed (e.g., 402 quota exceeded)
        res.status(500).json({ message: "Error fetching recipes from external source", details: error.message });
    }
};


// --- Get Single Recipe Details (Needs Firebase check for Cache) ---
const getRecipeDetails = async (req, res) => {
    // Safety Check for DB needed for caching
    if (!checkRecipeDbInitialized(res)) return;

    const { recipeId } = req.params;
    const cacheDurationMinutes = 60 * 24 * 3; // Cache for 3 days (adjust)

    if (!recipeId || isNaN(recipeId)) {
        return res.status(400).json({ message: "Valid Recipe ID is required." });
    }

    const recipeIdStr = String(recipeId);

    try {
        // Use db instance
        console.log(`getRecipeDetails: Checking cache for recipes/${recipeIdStr}`);
        const recipeRef = db.collection('recipes').doc(recipeIdStr);
        const doc = await recipeRef.get();

        // 1. Check Cache
        if (doc.exists) {
            const data = doc.data();
            const cachedAt = data.cachedAt?.toDate();
            const now = new Date();

            if (cachedAt && (now.getTime() - cachedAt.getTime()) < cacheDurationMinutes * 60 * 1000) {
                console.log(`CACHE HIT: Returning cached details for recipe ${recipeIdStr}`);
                return res.status(200).json({ ...data, id: parseInt(recipeIdStr, 10) });
            } else {
                console.log(`CACHE ${cachedAt ? 'EXPIRED' : 'MISSING'} for recipe ${recipeIdStr}`);
            }
        } else {
            console.log(`CACHE MISS: No cache found for recipe ${recipeIdStr}`);
        }

        // 2. Fetch from Spoonacular
        console.log(`FETCHING details from Spoonacular for recipe ${recipeIdStr}`);
        const apiUrl = `https://api.spoonacular.com/recipes/${recipeIdStr}/information?apiKey=${SPOONACULAR_API_KEY}&includeNutrition=true`;
        const response = await axios.get(apiUrl);
        const recipeDetails = response.data;

        if (!recipeDetails || !recipeDetails.id) {
            return res.status(404).json({ message: `Recipe ${recipeIdStr} not found via Spoonacular.` });
        }

        // 3. Save to Cache (Firestore)
        const dataToCache = {
            ...recipeDetails,
            cachedAt: new Date(), // Use client time for cache timestamp is fine
            sourceApi: "spoonacular",
        };
        // Use db instance
        await recipeRef.set(dataToCache, { merge: true });
        console.log(`CACHED details for recipe ${recipeIdStr} in Firestore.`);

        // 4. Return fetched data
        return res.status(200).json(recipeDetails);

    } catch (error) {
        // Log the specific error - check if it's the UNAUTHENTICATED one
        console.error(`Error in getRecipeDetails for ID ${recipeIdStr}:`, error);
         if (error.code === 16 || error.message?.includes("UNAUTHENTICATED")) {
             console.error("!!! UNAUTHENTICATED error occurred during Firestore operation in getRecipeDetails !!!");
             // Return a generic server error, as the specific reason is config/init related
             return res.status(500).json({ message: "Server configuration error processing request." });
         }
         // Handle specific Spoonacular errors
         if (error.response && error.response.status === 402) {
             return res.status(402).json({ message: "External API quota likely exceeded." });
         }
         if (error.response && error.response.status === 404) { // Spoonacular 404
            // Optionally cache the 404 status? For now, just return it.
             return res.status(404).json({ message: `Recipe ${recipeIdStr} not found via external source.` });
         }
         // Firestore or other errors
        res.status(500).json({ message: "Error fetching recipe details", error: error.message });
    }
};

module.exports = {
    fetchRecipes,
    getRecipeDetails
};