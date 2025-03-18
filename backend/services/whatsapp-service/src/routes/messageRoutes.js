/**
 * Rotas para gerenciamento de mensagens WhatsApp
 */

const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const MessageController = require('../controllers/messageController');
const { validateMessageQuery, validateMessageSend } = require('../validators/messageValidators');

// Controlador de mensagens
const messageController = new MessageController();

/**
 * @route   GET /api/whatsapp/messages
 * @desc    Obtém mensagens com filtros
 * @access  Privado
 */
router.get('/', validateMessageQuery, asyncHandler(messageController.getMessages));

/**
 * @route   GET /api/whatsapp/messages/:id
 * @desc    Obtém uma mensagem pelo ID
 * @access  Privado
 */
router.get('/:id', asyncHandler(messageController.getMessageById));

/**
 * @route   POST /api/whatsapp/messages
 * @desc    Envia uma nova mensagem
 * @access  Privado
 */
router.post('/', validateMessageSend, asyncHandler(messageController.sendMessage));

/**
 * @route   GET /api/whatsapp/messages/chat/:chatId
 * @desc    Obtém mensagens de um chat específico
 * @access  Privado
 */
router.get('/chat/:chatId', asyncHandler(messageController.getMessagesByChat));

/**
 * @route   DELETE /api/whatsapp/messages/:id
 * @desc    Exclui uma mensagem
 * @access  Privado
 */
router.delete('/:id', asyncHandler(messageController.deleteMessage));

/**
 * @route   POST /api/whatsapp/messages/:id/read
 * @desc    Marca uma mensagem como lida
 * @access  Privado
 */
router.post('/:id/read', asyncHandler(messageController.markAsRead));

/**
 * @route   GET /api/whatsapp/messages/unread
 * @desc    Obtém mensagens não lidas
 * @access  Privado
 */
router.get('/unread', asyncHandler(messageController.getUnreadMessages));

module.exports = router;
