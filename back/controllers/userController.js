const { admin, db } = require("../config/firebase");
const { MODES } = require("../config/constants");

const logout = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "userId est requis" });

        await db.collection("logoutlogs").doc().set({
            userId,
            loggedOutAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({ message: "Déconnexion réussie" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// add name and lastname
const updateProfile = async (req, res) => {
    try {
        const { uid, firstName, lastName, userType } = req.body;

        console.log("Received data:", { uid, firstName, lastName, userType });

        if (!uid || !firstName || !lastName || !userType) {
            console.error("Missing fields:", { uid, firstName, lastName, userType });
            return res.status(400).json({ error: "All fields are required (uid, firstName, lastName, userType)" });
        }

        const userRef = db.collection("users").doc(uid);

        console.log(` Updating user: ${uid} in Firestore...`);

        await userRef.update({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            userType: userType.trim(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`User ${uid} updated successfully!`);
        res.status(200).json({ message: "Profile updated successfully" });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};
const updateGoal = async (req, res) => {
    try {
        const { uid, goal } = req.body;

        if (!uid || !goal) {
            return res.status(400).json({ error: "User ID and goal are required" });
        }

        const validGoals = ["Losing Weight", "Maintaining Weight", "Gaining Weight"];
        if (!validGoals.includes(goal)) {
            return res.status(400).json({ error: "Invalid goal selection" });
        }

        const userRef = db.collection("users").doc(uid);
        await userRef.update({
            goal: goal,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`User ${uid} updated their goal to: ${goal}`);
        res.status(200).json({ message: "Goal updated successfully" });

    } catch (error) {
        console.error("Error updating goal:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// update setting profile 
const updateProfileDetails = async (req, res) => {
    try {
        const { uid, gender, age, height, weight, targetWeight, isKg } = req.body;

        console.log("Received Data:", req.body); // Log request data

        if (!uid || !gender || !age || !height || !weight || !targetWeight || isKg === undefined) {
            console.error("Missing fields in request:", { uid, gender, age, height, weight, targetWeight, isKg });
            return res.status(400).json({ error: "All fields are required (uid, gender, age, height, weight, targetWeight, isKg)" });
        }

        const userRef = db.collection("users").doc(uid);

        await userRef.update({
            gender,
            age: parseInt(age), // Convert to integer
            height: parseFloat(height), // Convert to number
            weight: parseFloat(weight),
            targetWeight: parseFloat(targetWeight),
            isKg,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`User ${uid} profile details updated successfully!`);
        res.status(200).json({ message: "Profile details updated successfully" });

    } catch (error) {
        console.error("Error updating profile details:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// transformation screen
const updateTransformation = async (req, res) => {
    try {
        const { uid, transformationGoals } = req.body;

        if (!uid || !transformationGoals || !Array.isArray(transformationGoals) || transformationGoals.length === 0) {
            return res.status(400).json({ error: "User ID and at least one transformation goal are required" });
        }

        const userRef = db.collection("users").doc(uid);
        await userRef.update({
            transformationGoals: transformationGoals,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`User ${uid} updated their transformation goals: ${transformationGoals}`);
        res.status(200).json({ message: "Transformation goals updated successfully" });

    } catch (error) {
        console.error("Error updating transformation goals:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
//Dietary preferences
const updateDietaryPreferences = async (req, res) => {
    try {
        const { uid, dietaryPreferences } = req.body;

        if (!uid || !dietaryPreferences || dietaryPreferences.length === 0) {
            return res.status(400).json({ error: "User ID and at least one dietary preference are required" });
        }

        const userRef = db.collection("users").doc(uid);
        await userRef.update({
            dietaryPreferences: dietaryPreferences,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`User ${uid} updated their dietary preferences:`, dietaryPreferences);
        res.status(200).json({ message: "Dietary preferences updated successfully" });

    } catch (error) {
        console.error("Error updating dietary preferences:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


// ActivityLevel
const updateActivityLevel = async (req, res) => {
    try {
      const { uid, activityLevel } = req.body;
  
      if (!uid || !activityLevel) {
        return res.status(400).json({ error: "User ID and activity level are required" });
      }
  
      const validLevels = ["Mostly Sitting 🪑", "Lightly Active 🚶", "Active Lifestyle 🚴", "Highly Active 💪"];
      if (!validLevels.includes(activityLevel)) {
        return res.status(400).json({ error: "Invalid activity level selection" });
      }
  
      const userRef = db.collection("users").doc(uid);
      await userRef.update({
        activityLevel,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  
      console.log(`User ${uid} updated their activity level to: ${activityLevel}`);
      res.status(200).json({ message: "Activity level updated successfully" });
  
    } catch (error) {
      console.error("Error updating activity level:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  




module.exports = {logout, updateProfile, updateGoal, updateProfileDetails, updateTransformation, updateDietaryPreferences, updateActivityLevel} ;
