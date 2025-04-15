// routes/expertRoutes.js
const express = require('express');
const router = express.Router();
const expertForm = require('../controllers/expertForm'); // Assuming controller is here

router.post(
    '/register',
    expertForm.uploadMiddleware, // <-- MUST BE HERE
    expertForm.registerNutritionist
);

module.exports = router;