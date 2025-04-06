const { admin, db } = require("../config/firebase");
const bcrypt = require("bcrypt");
// Constants for fiber calculations
const FIBER_GOAL_LOW = 25;
const FIBER_GOAL_HIGH = 38;

/**
 * @desc    Calculate nutrition plan based on user data
 * @access  Private
 */
const calculateNutritionPlan = (userData) => {
  const heightCm = userData.height; // Already in cm, no conversion needed

  const bmr = userData.gender.toLowerCase() === 'male'
    ? 10 * userData.weight + 6.25 * heightCm - 5 * userData.age + 5
    : 10 * userData.weight + 6.25 * heightCm - 5 * userData.age - 161;

  const activityMap = {
    "Mostly Sitting": 1.2,
    "Lightly Active": 1.375,
    "Moderately Active": 1.55,
    "Active Lifestyle": 1.725,
    "Highly Active": 1.9
  };

  const activityFactor = activityMap[userData.activityLevel] || 1.375;  // Default to "Lightly Active" if missing
  const tdee = bmr * activityFactor;

  let calories;
  switch(userData.goal) {
    case "Losing Weight": 
      calories = tdee - 500; 
      break;
    case "Gaining Weight": 
      calories = tdee + 500; 
      break;
    default: 
      calories = tdee;
  }

  // Calculate macronutrient goals
  const proteinGoal = Math.round(userData.weight * 1.5);  // Adjust protein goal for weight loss
  const fatGoal = Math.round((calories * 0.3) / 9);  // 30% of calories from fat
  const carbsGoal = Math.round((calories * 0.5) / 4);  // 50% of calories from carbs

  return {
    calories: Math.round(calories),
    protein: proteinGoal,
    carbs: carbsGoal,
    fat: fatGoal,
    fiber: {
      min: FIBER_GOAL_LOW,
      max: FIBER_GOAL_HIGH,
      recommended: Math.round((FIBER_GOAL_LOW + FIBER_GOAL_HIGH) / 2)
    }
  };
};

/**
 * @desc    Save or update user's nutrition plan
 * @route   PUT /api/nutrition-plan/:uid
 * @access  Private
 */
const saveNutritionPlan = async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get user data first
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const nutritionPlan = calculateNutritionPlan(userData);

    // Save or update the nutrition plan
    await userRef.update({
      nutritionPlan: {
        ...nutritionPlan,
        fiberGoal: `${nutritionPlan.fiber.min}-${nutritionPlan.fiber.max}g`
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Nutrition plan updated for user ${uid}`);
    res.status(200).json({
      success: true,
      message: "Nutrition plan saved successfully",
      nutritionPlan
    });

  } catch (error) {
    console.error("Error saving nutrition plan:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
};

/**
 * @desc    Get user's nutrition plan
 * @route   GET /api/nutrition-plan/:uid
 * @access  Private
 */
const getNutritionPlan = async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    
    if (!userData.nutritionPlan) {
      return res.status(404).json({ error: "Nutrition plan not found" });
    }

    res.status(200).json({
      success: true,
      nutritionPlan: userData.nutritionPlan
    });

  } catch (error) {
    console.error("Error fetching nutrition plan:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
};

module.exports = {
  saveNutritionPlan,
  getNutritionPlan
};
