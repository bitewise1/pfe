// controllers/userController.js

// Import the object holding the instances
const { firebaseInstances } = require('../config/firebase');
// Access admin and db via the firebaseInstances object
const admin = firebaseInstances.admin;
const db = firebaseInstances.db;

// Note: Constants import remains the same if needed
// const { MODES } = require("../config/constants");

// --- Helper function for safety checks ---
function checkUserFirebaseInitialized(res) {
    if (!admin || !db) {
        console.error("FATAL: Firebase Admin/DB not initialized when trying to access user routes.");
        res.status(500).json({ error: "Server configuration error (User). Please try again later." });
        return false; // Indicates failure
    }
    return true; // Indicates success
}


const logout = async (req, res) => {
    // Safety Check
    if (!checkUserFirebaseInitialized(res)) return;

    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "userId est requis" });

        // Use db instance
        console.log(`Logging logout for user: ${userId}`);
        await db.collection("logoutlogs").add({ // Use add() for auto-generated ID
            userId,
            loggedOutAt: admin.firestore.FieldValue.serverTimestamp(), // Use admin instance
        });

        res.status(200).json({ message: "Déconnexion réussie" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ error: error.message || "Internal server error during logout." });
    }
};

const updateProfile = async (req, res) => {
    // Safety Check
    if (!checkUserFirebaseInitialized(res)) return;

    try {
        const { uid, firstName, lastName, userType } = req.body;
        console.log("Received data for updateProfile:", { uid, firstName, lastName, userType });

        if (!uid || !firstName || !lastName || !userType) {
            console.error("Missing fields for updateProfile:", { uid, firstName, lastName, userType });
            return res.status(400).json({ error: "All fields are required (uid, firstName, lastName, userType)" });
        }

        // Use db instance
        const userRef = db.collection("users").doc(uid);
        console.log(`Updating user profile: ${uid} in Firestore...`);

        await userRef.update({
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            userType: String(userType).trim(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp() // Use admin instance
        });

        console.log(`User ${uid} profile updated successfully!`);
        res.status(200).json({ message: "Profile updated successfully" });

    } catch (error) {
        console.error(`Error updating profile for ${uid}:`, error);
        if (error.code === 5) { // Firestore code for NOT_FOUND
             return res.status(404).json({ error: "User profile not found to update." });
        }
        res.status(500).json({ error: error.message || "Internal server error updating profile" });
    }
};

const updateGoal = async (req, res) => {
    // Safety Check
    if (!checkUserFirebaseInitialized(res)) return;

    try {
        const { uid, goal } = req.body;
        if (!uid || !goal) {
            return res.status(400).json({ error: "User ID and goal are required" });
        }

        // Consider making validGoals a constant or loading from config
        const validGoals = ["Losing Weight", "Maintaining Weight", "Gaining Weight"];
        if (!validGoals.includes(goal)) {
            return res.status(400).json({ error: "Invalid goal selection" });
        }

        // Use db instance
        const userRef = db.collection("users").doc(uid);
        await userRef.update({
            goal: goal,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Use admin instance
        });

        console.log(`User ${uid} updated their goal to: ${goal}`);
        res.status(200).json({ message: "Goal updated successfully" });

    } catch (error) {
        console.error(`Error updating goal for ${uid}:`, error);
         if (error.code === 5) {
             return res.status(404).json({ error: "User profile not found to update goal." });
        }
        res.status(500).json({ error: "Internal server error updating goal" });
    }
};


const updateProfileDetails = async (req, res) => {
    // Safety Check
    if (!checkUserFirebaseInitialized(res)) return;

    try {
        const { uid, gender, age, height, weight, targetWeight, isKg } = req.body;
        console.log("Received Data for updateProfileDetails:", req.body);

        // Add validation for types if necessary (e.g., is age a number?)
        if (!uid || !gender || age === undefined || height === undefined || weight === undefined || targetWeight === undefined || isKg === undefined) {
            console.error("Missing fields in request for updateProfileDetails:", req.body);
            return res.status(400).json({ error: "All fields are required (uid, gender, age, height, weight, targetWeight, isKg)" });
        }

        // Use db instance
        const userRef = db.collection("users").doc(uid);
        await userRef.update({
            gender,
            age: parseInt(age, 10), // Specify radix 10
            height: parseFloat(height),
            weight: parseFloat(weight),
            targetWeight: parseFloat(targetWeight),
            isKg: Boolean(isKg), // Ensure boolean
            updatedAt: admin.firestore.FieldValue.serverTimestamp() // Use admin instance
        });

        console.log(`User ${uid} profile details updated successfully!`);
        res.status(200).json({ message: "Profile details updated successfully" });

    } catch (error) {
        console.error(`Error updating profile details for ${uid}:`, error);
         if (error.code === 5) {
             return res.status(404).json({ error: "User profile not found to update details." });
        }
        res.status(500).json({ error: "Internal server error updating profile details" });
    }
};


const updateTransformation = async (req, res) => {
    // Safety Check
    if (!checkUserFirebaseInitialized(res)) return;

    try {
        const { uid, transformationGoals } = req.body;
        if (!uid || !Array.isArray(transformationGoals)) { // Check if it's an array
            return res.status(400).json({ error: "User ID and transformationGoals (as an array) are required" });
        }

        // Use db instance
        const userRef = db.collection("users").doc(uid);
        await userRef.update({
            transformationGoals: transformationGoals, // Assumes transformationGoals is a valid array
            updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Use admin instance
        });

        console.log(`User ${uid} updated their transformation goals: ${transformationGoals.join(', ')}`);
        res.status(200).json({ message: "Transformation goals updated successfully" });

    } catch (error) {
        console.error(`Error updating transformation goals for ${uid}:`, error);
         if (error.code === 5) {
             return res.status(404).json({ error: "User profile not found to update transformation goals." });
        }
        res.status(500).json({ error: "Internal server error updating transformation goals" });
    }
};

const updateDietaryPreferences = async (req, res) => {
    // Safety Check
    if (!checkUserFirebaseInitialized(res)) return;

    try {
        const { uid, dietaryPreferences } = req.body;
        if (!uid || !Array.isArray(dietaryPreferences)) { // Check if it's an array
            return res.status(400).json({ error: "User ID and dietaryPreferences (as an array) are required" });
        }

        // Use db instance
        const userRef = db.collection("users").doc(uid);
        await userRef.update({
            dietaryPreferences: dietaryPreferences, // Assumes dietaryPreferences is a valid array
            updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Use admin instance
        });

        console.log(`User ${uid} updated their dietary preferences:`, dietaryPreferences);
        res.status(200).json({ message: "Dietary preferences updated successfully" });

    } catch (error) {
        console.error(`Error updating dietary preferences for ${uid}:`, error);
         if (error.code === 5) {
             return res.status(404).json({ error: "User profile not found to update dietary preferences." });
        }
        res.status(500).json({ error: "Internal server error updating dietary preferences" });
    }
};


const updateActivityLevel = async (req, res) => {
    // Safety Check
    if (!checkUserFirebaseInitialized(res)) return;

    try {
        const { uid, activityLevel } = req.body;
        if (!uid || !activityLevel) {
            return res.status(400).json({ error: "User ID and activity level are required" });
        }

        // Consider making validLevels a constant or loading from config
        const validLevels = ["Mostly Sitting 🪑", "Lightly Active 🚶", "Active Lifestyle 🚴", "Highly Active 💪"];
        if (!validLevels.includes(activityLevel)) {
            return res.status(400).json({ error: "Invalid activity level selection" });
        }

        // Use db instance
        const userRef = db.collection("users").doc(uid);
        await userRef.update({
            activityLevel,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Use admin instance
        });

        console.log(`User ${uid} updated their activity level to: ${activityLevel}`);
        res.status(200).json({ message: "Activity level updated successfully" });

    } catch (error) {
        console.error(`Error updating activity level for ${uid}:`, error);
         if (error.code === 5) {
             return res.status(404).json({ error: "User profile not found to update activity level." });
        }
        res.status(500).json({ error: "Internal server error updating activity level" });
    }
};

const getUserById = async (req, res) => {
    // Safety Check
    if (!checkUserFirebaseInitialized(res)) return;

    const { uid } = req.params;
    console.log("getUserById received UID:", uid);

    if (!uid) {
        // Should not happen if route param is defined correctly, but good practice
        return res.status(400).json({ error: 'User ID parameter is required in the URL path.' });
    }

    try {
        // Use db instance
        console.log(`Fetching user data for UID: ${uid}`);
        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            console.log(`User not found for UID: ${uid}`);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`User data found for UID: ${uid}`);
        res.status(200).json(doc.data());
    } catch (err) {
        console.error(`Error fetching user ${uid}:`, err);
        // Check for specific errors if needed
        res.status(500).json({ error: 'Server error while fetching user data.' });
    }
};


module.exports = {logout, updateProfile, updateGoal, updateProfileDetails, updateTransformation, updateDietaryPreferences, updateActivityLevel, getUserById} ;