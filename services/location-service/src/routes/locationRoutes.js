
const express = require('express');
const { giveTrackingConsent } = require('../controllers/locationController');

const router = express.Router();

// Rota para o estafeta aceitar o rastreamento uma vez
router.post('/consent', giveTrackingConsent);

module.exports = router;
