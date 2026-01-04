const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

// the route
router.post('/webhook', leadController.processLead);

module.exports = router;
