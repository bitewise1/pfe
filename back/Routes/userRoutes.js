const express = require("express");
const { logout, updateProfile, updateGoal, updateProfileDetails, updateTransformation, updateDietaryPreferences, updateActivityLevel } = require("../controllers/userController");

const router = express.Router();
router.post("/updateProfile", updateProfile);
router.post("/updateGoal", updateGoal);
router.post("/updateProfileDetails", updateProfileDetails);
router.post("/logout", logout);
router.post("/updateTransformation", updateTransformation);
router.post("/updateDietaryPreferences", updateDietaryPreferences);
router.post("/updateActivityLevel", updateActivityLevel);
module.exports = router;
