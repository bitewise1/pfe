// Routes/logMealRoutes.js (or your equivalent name)
const express = require('express');
// UPDATE THIS LINE to import both functions from YOUR controller file
const { logMeal, getCombinedDailyData } = require('../controllers/logMealController.js'); // Use YOUR controller filename
const router = express.Router();

// Your existing route for logging
router.post('/log-meal', logMeal); // Assuming this path is correct

// ADD THIS NEW ROUTE for fetching the combined data
router.get('/daily-data/:uid/:date', getCombinedDailyData);

module.exports = router;