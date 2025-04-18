const express = require('express');
const router = express.Router();
const expertForm = require('../controllers/expertForm'); 

router.post(
    '/register',
    expertForm.uploadMiddleware, 
    expertForm.registerNutritionist
);

module.exports = router;