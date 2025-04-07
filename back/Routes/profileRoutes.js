// routes/profileRoutes.js

const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController'); // Import the updated controller

// --- Profile Routes (Handles requests mounted under /user or /api/user) ---

// Handles POST /user/log-weight
router.post('/log-weight', profileController.logWeight);

// Handles GET /user/calorie-history/:uid?period=...
router.get('/calorie-history/:uid', profileController.getCalorieHistory); // Uses the calorie history function

module.exports = router;