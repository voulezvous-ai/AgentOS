/**
 * Middleware para tratamento centralizado de erros na API
 */
const { logger } = require('../../../infrastructure/logging/logger');
const { ApplicationError, DomainError, InfrastructureError } = require('../../../domain/core/exceptions');

/**
 * Middleware de tratamento de erros centralizado
 */
exports.errorHandler = (err, req, res, next) => {
  // Capturar detalhes da requisição para o log
  const requestDetails = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id || 'anonymous'
  };

  // Processar o erro de acordo com o tipo
  let statusCode = 500;
  let errorResponse = {
    success: false,
    message: 'Erro interno do servidor',
    code: 'INTERNAL_SERVER_ERROR'
  };

  // Tratamento específico para diferentes tipos de erro
  if (err instanceof ApplicationError) {
    statusCode = 400;
    errorResponse.message = err.message;
    errorResponse.code = err.code;
    errorResponse.details = err.details;
    
    logger.warn('Erro de aplicação', { 
      ...requestDetails, 
      error: { message: err.message, code: err.code, stack: err.stack } 
    });
  } 
  else if (err instanceof DomainError) {
    statusCode = 422;
    errorResponse.message = err.message;
    errorResponse.code = err.code;
    errorResponse.details = err.details;
    
    logger.warn('Erro de domínio', { 
      ...requestDetails, 
      error: { message: err.message, code: err.code, stack: err.stack } 
    });
  } 
  else if (err instanceof InfrastructureError) {
    statusCode = 503;
    errorResponse.message = 'Serviço temporariamente indisponível';
    errorResponse.code = err.code || 'SERVICE_UNAVAILABLE';
    
    logger.error('Erro de infraestrutura', { 
      ...requestDetails, 
      error: { message: err.message, code: err.code, stack: err.stack } 
    });
  } 
  else if (err.name === 'ValidationError') {
    // Erro de validação (ex: Mongoose)
    statusCode = 400;
    errorResponse.message = 'Erro de validação dos dados';
    errorResponse.code = 'VALIDATION_ERROR';
    errorResponse.details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    logger.warn('Erro de validação', { 
      ...requestDetails, 
      error: { message: err.message, details: errorResponse.details } 
    });
  } 
  else {
    // Erros não categorizados
    logger.error('Erro não tratado', { 
      ...requestDetails, 
      error: { message: err.message, stack: err.stack } 
    });
  }

  // Em ambiente de desenvolvimento, incluir a stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Enviar resposta de erro ao cliente
  res.status(statusCode).json(errorResponse);
};
