
const express = require('express');
const { assignOrdersToCourier } = require('../controllers/orderController');

const router = express.Router();

// Rota para atribuir pedidos ao estafeta com opção de rota automática ou manual
router.post('/assign', assignOrdersToCourier);

module.exports = router;
