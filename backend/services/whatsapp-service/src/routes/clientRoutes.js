/**
 * Rotas para gerenciamento de clientes WhatsApp
 */

const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const ClientController = require('../controllers/clientController');
const { validateClientCreation } = require('../validators/clientValidators');

// Controlador de clientes
const clientController = new ClientController();

/**
 * @route   GET /api/whatsapp/clients
 * @desc    Obtém todos os clientes
 * @access  Privado
 */
router.get('/', asyncHandler(clientController.getAllClients));

/**
 * @route   GET /api/whatsapp/clients/:id
 * @desc    Obtém um cliente pelo ID
 * @access  Privado
 */
router.get('/:id', asyncHandler(clientController.getClientById));

/**
 * @route   POST /api/whatsapp/clients
 * @desc    Cria um novo cliente
 * @access  Privado
 */
router.post('/', validateClientCreation, asyncHandler(clientController.createClient));

/**
 * @route   DELETE /api/whatsapp/clients/:id
 * @desc    Remove um cliente
 * @access  Privado
 */
router.delete('/:id', asyncHandler(clientController.deleteClient));

/**
 * @route   POST /api/whatsapp/clients/:id/qr
 * @desc    Gera QR code para um cliente
 * @access  Privado
 */
router.post('/:id/qr', asyncHandler(clientController.generateQR));

/**
 * @route   POST /api/whatsapp/clients/:id/logout
 * @desc    Desconecta um cliente
 * @access  Privado
 */
router.post('/:id/logout', asyncHandler(clientController.logoutClient));

/**
 * @route   GET /api/whatsapp/clients/:id/chats
 * @desc    Obtém chats de um cliente
 * @access  Privado
 */
router.get('/:id/chats', asyncHandler(clientController.getClientChats));

/**
 * @route   POST /api/whatsapp/clients/:id/message
 * @desc    Envia mensagem através de um cliente
 * @access  Privado
 */
router.post('/:id/message', asyncHandler(clientController.sendMessage));

/**
 * @route   GET /api/whatsapp/clients/:id/status
 * @desc    Obtém status de um cliente
 * @access  Privado
 */
router.get('/:id/status', asyncHandler(clientController.getClientStatus));

module.exports = router;
