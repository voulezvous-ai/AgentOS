/**
 * Configuração das rotas do serviço WhatsApp
 */

const express = require('express');
const clientRoutes = require('./clientRoutes');
const messageRoutes = require('./messageRoutes');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Rota básica de informação da API
router.get('/', (req, res) => {
  res.json({
    service: 'WhatsApp Service API',
    version: '1.0.0',
    endpoints: [
      '/clients',
      '/messages',
    ],
  });
});

// Aplicação de middleware de autenticação
router.use(authMiddleware);

// Rotas dos clientes WhatsApp
router.use('/clients', clientRoutes);

// Rotas de mensagens
router.use('/messages', messageRoutes);

module.exports = router;
