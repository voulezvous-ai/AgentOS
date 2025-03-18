/**
 * Validadores para requisições relacionadas a mensagens WhatsApp
 */

const { check, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Middleware para validar resultados da validação e retornar erros
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Dados de requisição inválidos',
      details: errors.array() 
    });
  }
  next();
};

/**
 * Validação para consulta de mensagens
 */
const validateMessageQuery = [
  query('clientId')
    .optional()
    .isMongoId().withMessage('ID de cliente inválido'),
  
  query('chatId')
    .optional()
    .isString().withMessage('ID de chat deve ser uma string'),
  
  query('sender')
    .optional()
    .isString().withMessage('Remetente deve ser uma string'),
  
  query('fromMe')
    .optional()
    .isBoolean().withMessage('fromMe deve ser um booleano')
    .toBoolean(),
  
  query('hasMedia')
    .optional()
    .isBoolean().withMessage('hasMedia deve ser um booleano')
    .toBoolean(),
  
  query('startDate')
    .optional()
    .isISO8601().withMessage('Data inicial deve estar no formato ISO8601'),
  
  query('endDate')
    .optional()
    .isISO8601().withMessage('Data final deve estar no formato ISO8601'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limite deve ser um número entre 1 e 100')
    .toInt(),
  
  query('skip')
    .optional()
    .isInt({ min: 0 }).withMessage('Skip deve ser um número não negativo')
    .toInt(),
  
  query('sort')
    .optional()
    .isString().withMessage('Sort deve ser uma string'),
  
  handleValidationErrors
];

/**
 * Validação para envio de mensagem
 */
const validateMessageSend = [
  check('clientId')
    .notEmpty().withMessage('ID do cliente é obrigatório')
    .isMongoId().withMessage('ID de cliente inválido'),
  
  check('recipient')
    .notEmpty().withMessage('Destinatário é obrigatório')
    .isString().withMessage('Destinatário deve ser uma string')
    .matches(/^\d+$/).withMessage('Destinatário deve conter apenas números'),
  
  check('message')
    .notEmpty().withMessage('Mensagem é obrigatória')
    .isString().withMessage('Mensagem deve ser uma string'),
  
  check('type')
    .optional()
    .isIn(['text', 'image', 'video', 'audio', 'document']).withMessage('Tipo de mensagem inválido'),
  
  check('options')
    .optional()
    .isObject().withMessage('Opções devem ser um objeto'),
  
  handleValidationErrors
];

/**
 * Validação para ID de mensagem
 */
const validateMessageId = [
  check('id')
    .notEmpty().withMessage('ID é obrigatório')
    .isMongoId().withMessage('ID inválido'),
  
  handleValidationErrors
];

/**
 * Validação para mensagens de um chat
 */
const validateChatMessages = [
  check('chatId')
    .notEmpty().withMessage('ID do chat é obrigatório')
    .isString().withMessage('ID do chat deve ser uma string'),
  
  query('clientId')
    .optional()
    .isMongoId().withMessage('ID de cliente inválido'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limite deve ser um número entre 1 e 100')
    .toInt(),
  
  query('skip')
    .optional()
    .isInt({ min: 0 }).withMessage('Skip deve ser um número não negativo')
    .toInt(),
  
  handleValidationErrors
];

module.exports = {
  validateMessageQuery,
  validateMessageSend,
  validateMessageId,
  validateChatMessages,
};
