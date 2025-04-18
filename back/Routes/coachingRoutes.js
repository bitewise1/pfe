const express = require('express');
const router = express.Router();
const coachingController = require('../controllers/coachingController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/status', requireAuth, coachingController.getCoachingStatus);

router.post('/select', requireAuth, coachingController.selectCoach);

router.post('/request', requireAuth, coachingController.sendCoachRequest);

router.get('/request-status/:nutritionistId', requireAuth, coachingController.getSpecificRequestStatus);

router.post('/end-relationship', requireAuth, coachingController.endRelationship);
router.post('/block', requireAuth, coachingController.blockCoach);
router.post('/unblock', requireAuth, coachingController.unblockCoach); 
router.post('/rate', requireAuth, coachingController.rateCoach);



module.exports = router;