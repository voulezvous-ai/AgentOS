/**
 * Validadores para requisições relacionadas a clientes WhatsApp
 */

const { check, validationResult } = require('express-validator');
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
 * Validação para criação de cliente
 */
const validateClientCreation = [
  check('name')
    .notEmpty().withMessage('Nome é obrigatório')
    .isString().withMessage('Nome deve ser uma string')
    .isLength({ min: 3, max: 50 }).withMessage('Nome deve ter entre 3 e 50 caracteres'),
  
  check('description')
    .optional()
    .isString().withMessage('Descrição deve ser uma string')
    .isLength({ max: 200 }).withMessage('Descrição deve ter no máximo 200 caracteres'),
  
  check('type')
    .optional()
    .isIn(['webjs', 'baileys']).withMessage('Tipo deve ser webjs ou baileys'),
  
  check('metadata')
    .optional()
    .isObject().withMessage('Metadata deve ser um objeto'),
  
  handleValidationErrors
];

/**
 * Validação para atualização de cliente
 */
const validateClientUpdate = [
  check('name')
    .optional()
    .isString().withMessage('Nome deve ser uma string')
    .isLength({ min: 3, max: 50 }).withMessage('Nome deve ter entre 3 e 50 caracteres'),
  
  check('description')
    .optional()
    .isString().withMessage('Descrição deve ser uma string')
    .isLength({ max: 200 }).withMessage('Descrição deve ter no máximo 200 caracteres'),
  
  check('metadata')
    .optional()
    .isObject().withMessage('Metadata deve ser um objeto'),
  
  handleValidationErrors
];

/**
 * Validação para ID de cliente
 */
const validateClientId = [
  check('id')
    .notEmpty().withMessage('ID é obrigatório')
    .isMongoId().withMessage('ID inválido'),
  
  handleValidationErrors
];

/**
 * Validação para envio de mensagem via cliente
 */
const validateClientMessageSend = [
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

module.exports = {
  validateClientCreation,
  validateClientUpdate,
  validateClientId,
  validateClientMessageSend,
};
