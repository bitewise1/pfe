// Routes/coachingRoutes.js
const express = require('express');
const router = express.Router();
const coachingController = require('../controllers/coachingController');
const { requireAuth } = require('../middleware/authMiddleware');

// GET status (active coach or pending/accepted requests)
router.get('/status', requireAuth, coachingController.getCoachingStatus);

// POST to select an accepted coach
router.post('/select', requireAuth, coachingController.selectCoach);

// POST to send a new request TO a nutritionist
router.post('/request', requireAuth, coachingController.sendCoachRequest);

// GET the status of a request between user and specific nutritionist
router.get('/request-status/:nutritionistId', requireAuth, coachingController.getSpecificRequestStatus);

// --- V V V --- ADD/VERIFY THESE ROUTES --- V V V ---
router.post('/end-relationship', requireAuth, coachingController.endRelationship);
router.post('/block', requireAuth, coachingController.blockCoach);
router.post('/unblock', requireAuth, coachingController.unblockCoach); // Optional
router.post('/rate', requireAuth, coachingController.rateCoach);
// --- ^ ^ ^ --- END ADD/VERIFY --- ^ ^ ^ ---


module.exports = router;