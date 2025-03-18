/**
 * Middleware para tratamento centralizado de erros na API
 * Formata respostas de erro de forma consistente
 */
const {
  BaseError,
  DomainError,
  ApplicationError,
  InfrastructureError,
  AuthError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError
} = require('../../domain/core/exceptions');

/**
 * Middleware de tratamento de erros
 * @param {Error} err Erro capturado
 * @param {Object} req Requisição Express
 * @param {Object} res Resposta Express
 * @param {Function} next Função next do Express
 */
function errorHandler(err, req, res, next) {
  console.error('Error handler caught:', err);
  
  // Variáveis para a resposta
  let statusCode = 500;
  let errorResponse = {
    success: false,
    error: {
      message: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    }
  };
  
  // Mapear tipos de erro para códigos HTTP
  if (err instanceof ValidationError) {
    statusCode = 400;
    errorResponse.error = {
      message: err.message || 'Dados de entrada inválidos',
      code: err.code || 'VALIDATION_ERROR',
      details: err.details || []
    };
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorResponse.error = {
      message: err.message || 'Recurso não encontrado',
      code: err.code || 'NOT_FOUND',
      resource: err.details?.resource
    };
  } else if (err instanceof AuthError) {
    statusCode = 401;
    errorResponse.error = {
      message: err.message || 'Não autorizado',
      code: err.code || 'UNAUTHORIZED'
    };
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    errorResponse.error = {
      message: err.message || 'Acesso proibido',
      code: err.code || 'FORBIDDEN'
    };
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    errorResponse.error = {
      message: err.message || 'Conflito de recursos',
      code: err.code || 'CONFLICT',
      resource: err.details?.resource
    };
  } else if (err instanceof DomainError) {
    statusCode = 422;
    errorResponse.error = {
      message: err.message || 'Erro de regra de negócio',
      code: err.code || 'DOMAIN_ERROR'
    };
  } else if (err instanceof ApplicationError) {
    statusCode = 400;
    errorResponse.error = {
      message: err.message || 'Erro de aplicação',
      code: err.code || 'APPLICATION_ERROR'
    };
  } else if (err instanceof InfrastructureError) {
    statusCode = 500;
    errorResponse.error = {
      message: 'Erro de infraestrutura',
      code: err.code || 'INFRASTRUCTURE_ERROR'
    };
  } else if (err instanceof BaseError) {
    statusCode = 500;
    errorResponse.error = {
      message: err.message || 'Erro inesperado',
      code: err.code || 'UNKNOWN_ERROR'
    };
  }
  
  // Em ambiente de desenvolvimento, incluir mais detalhes
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
    errorResponse.error.stack = err.stack;
    
    if (!(err instanceof BaseError)) {
      errorResponse.error.originalError = {
        message: err.message,
        name: err.name
      };
    }
  }
  
  // Registrar o erro (em produção, usar um serviço de logging apropriado)
  console.error(`[${new Date().toISOString()}] ${statusCode} ${req.method} ${req.originalUrl}:`, 
    err.message, err.stack);
  
  // Enviar resposta
  res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;
