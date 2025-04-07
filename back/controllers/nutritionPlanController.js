// controllers/nutritionPlanController.js

// Import the object holding the instances
const { firebaseInstances } = require('../config/firebase');
// Access admin and db via the firebaseInstances object
const admin = firebaseInstances.admin;
const db = firebaseInstances.db;

// Constants for fiber calculations
const FIBER_GOAL_LOW = 25;
const FIBER_GOAL_HIGH = 38;

// --- Helper function for safety checks ---
function checkNutritionPlanFirebaseInitialized(res) {
    if (!admin || !db) {
        console.error("FATAL: Firebase Admin/DB not initialized when trying to access nutrition plan routes.");
        res.status(500).json({ error: "Server configuration error (Nutrition Plan). Please try again later." });
        return false; // Indicates failure
    }
    return true; // Indicates success
}

/**
 * @desc    Calculate nutrition plan based on user data
 * @access  Private (Helper function, doesn't need req/res)
 */
const calculateNutritionPlan = (userData) => {
  // Input validation for userData fields used in calculation
  if (!userData || typeof userData.weight !== 'number' || typeof userData.height !== 'number' || typeof userData.age !== 'number' || !userData.gender || !userData.activityLevel || !userData.goal) {
      console.error("Cannot calculate nutrition plan: Missing or invalid user data fields.", { weight: userData?.weight, height: userData?.height, age: userData?.age, gender: userData?.gender, activityLevel: userData?.activityLevel, goal: userData?.goal });
      // Return null or throw error, depending on how you want to handle upstream
      return null;
  }

  const heightCm = userData.height; // Assuming height is stored in cm

  // Basic BMR Calculation (Harris-Benedict revised)
  const bmr = userData.gender.toLowerCase() === 'male'
    ? (10 * userData.weight) + (6.25 * heightCm) - (5 * userData.age) + 5
    : (10 * userData.weight) + (6.25 * heightCm) - (5 * userData.age) - 161;

  // Activity Factor Mapping (Ensure keys match exactly what's stored in DB)
  const activityMap = {
    "Mostly Sitting 🪑": 1.2,
    "Lightly Active 🚶": 1.375,
    // "Moderately Active": 1.55, // Add if this is a possible value
    "Active Lifestyle 🚴": 1.725,
    "Highly Active 💪": 1.9
  };
  const activityFactor = activityMap[userData.activityLevel] || 1.375;  // Default to Lightly Active
  const tdee = bmr * activityFactor; // Total Daily Energy Expenditure

  // Calorie Adjustment based on Goal
  let calories;
  switch(userData.goal) {
    case "Losing Weight":
      calories = tdee - 500; // Standard 500 kcal deficit
      break;
    case "Gaining Weight":
      calories = tdee + 300; // Moderate 300 kcal surplus
      break;
    case "Maintaining Weight":
    default:
      calories = tdee;
      break;
  }
  // Ensure calories don't go below a safe minimum (e.g., 1200)
  calories = Math.max(calories, 1200);


  // Macronutrient Calculation (Example: 40% C / 30% P / 30% F)
  // Adjust ratios based on goals or user preferences if needed
  const proteinGramsPerKg = userData.goal === "Gaining Weight" ? 1.8 : 1.6; // Slightly higher protein for gain/maintenance
  const proteinGoal = Math.round(userData.weight * proteinGramsPerKg);
  const proteinCalories = proteinGoal * 4;

  const fatPercentage = 0.30; // 30% fat
  const fatCalories = calories * fatPercentage;
  const fatGoal = Math.round(fatCalories / 9);

  const carbCalories = calories - proteinCalories - fatCalories;
  const carbsGoal = Math.round(carbCalories / 4);


  // Basic Fiber Goal (Can be more sophisticated)
  const fiberMin = FIBER_GOAL_LOW;
  const fiberMax = FIBER_GOAL_HIGH;
  const fiberRecommended = Math.round((fiberMin + fiberMax) / 2);

  return {
    calories: Math.round(calories),
    protein: proteinGoal,
    carbs: carbsGoal,
    fat: fatGoal,
    fiber: {
      min: fiberMin,
      max: fiberMax,
      recommended: fiberRecommended
    }
  };
};

/**
 * @desc    Save or update user's nutrition plan
 * @route   PUT /nutritionPlan/save/:uid  (Example route using param)
 * @access  Private
 */
const saveNutritionPlan = async (req, res) => {
  // Safety Check
  if (!checkNutritionPlanFirebaseInitialized(res)) return;

  try {
    const { uid } = req.params; // Get UID from route parameter
    if (!uid) {
      return res.status(400).json({ error: "User ID is required in the URL path." });
    }

    // Get latest user data first
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log(`User not found for nutrition plan calculation: ${uid}`);
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    // Calculate the plan based on fetched data
    console.log(`Calculating nutrition plan for user ${uid}`);
    const nutritionPlan = calculateNutritionPlan(userData);

    // Handle cases where calculation might fail due to missing user data
    if (!nutritionPlan) {
        console.error(`Could not calculate nutrition plan for user ${uid} due to missing profile data.`);
        return res.status(400).json({ error: "Cannot calculate plan, user profile data is incomplete (height, weight, age, gender, activity, goal)." });
    }


    // Prepare data to save
    const planToSave = {
        ...nutritionPlan,
        // Add the display string for fiber goal
        fiberGoal: `${nutritionPlan.fiber.min}-${nutritionPlan.fiber.max}g`
    };

    // Save/update the nutrition plan within the user document
    console.log(`Updating nutrition plan for user ${uid}`);
    await userRef.update({
      nutritionPlan: planToSave,
      nutritionPlanLastUpdated: admin.firestore.FieldValue.serverTimestamp() // Use admin instance
    });

    console.log(`Nutrition plan updated successfully for user ${uid}`);
    res.status(200).json({
      success: true,
      message: "Nutrition plan saved successfully",
      nutritionPlan: planToSave // Return the saved plan
    });

  } catch (error) {
    console.error(`Error saving nutrition plan for user ${req.params.uid}:`, error);
    res.status(500).json({
      error: "Internal server error while saving nutrition plan",
      details: error.message
    });
  }
};

/**
 * @desc    Get user's nutrition plan
 * @route   GET /nutritionPlan/:uid (Example route using param)
 * @access  Private
 */
const getNutritionPlan = async (req, res) => {
  // Safety Check
  if (!checkNutritionPlanFirebaseInitialized(res)) return;

  try {
    const { uid } = req.params; // Get UID from route parameter
    if (!uid) {
      return res.status(400).json({ error: "User ID is required in the URL path." });
    }

    console.log(`Fetching nutrition plan for user ${uid}`);
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        console.log(`User not found when fetching nutrition plan: ${uid}`);
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    if (!userData.nutritionPlan) {
        console.log(`Nutrition plan not found for user: ${uid}`);
      // Optionally: Calculate and return on the fly? Or require save first.
      return res.status(404).json({ error: "Nutrition plan has not been calculated or saved yet." });
    }

    console.log(`Nutrition plan found for user: ${uid}`);
    res.status(200).json({
      success: true,
      nutritionPlan: userData.nutritionPlan
    });

  } catch (error) {
    console.error(`Error fetching nutrition plan for user ${req.params.uid}:`, error);
    res.status(500).json({
      error: "Internal server error while fetching nutrition plan",
      details: error.message
    });
  }
};

module.exports = {
  saveNutritionPlan,
  getNutritionPlan,
  calculateNutritionPlan // Export helper if needed elsewhere
};