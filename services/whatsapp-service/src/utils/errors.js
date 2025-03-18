/**
 * Classes de erro personalizadas para o serviço WhatsApp
 */

/**
 * Erro de recurso não encontrado
 */
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

/**
 * Erro de validação
 */
class ValidationError extends Error {
  constructor(message, errors = {}) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.errors = errors;
  }
}

/**
 * Erro de serviço
 */
class ServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
  }
}

/**
 * Erro de autenticação
 */
class AuthenticationError extends Error {
  constructor(message = 'Falha na autenticação') {
    super(message);
    this.name = 'AuthenticationError';
    this.status = 401;
  }
}

/**
 * Erro de autorização
 */
class AuthorizationError extends Error {
  constructor(message = 'Acesso negado') {
    super(message);
    this.name = 'AuthorizationError';
    this.status = 403;
  }
}

/**
 * Erro de API externa
 */
class ExternalApiError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'ExternalApiError';
    this.status = 502;
    this.originalError = originalError;
  }
}

/**
 * Erro de limite excedido
 */
class RateLimitError extends Error {
  constructor(message = 'Limite de requisições excedido') {
    super(message);
    this.name = 'RateLimitError';
    this.status = 429;
  }
}

/**
 * Erro de tempo esgotado
 */
class TimeoutError extends Error {
  constructor(message = 'Tempo de operação esgotado') {
    super(message);
    this.name = 'TimeoutError';
    this.status = 408;
  }
}

module.exports = {
  NotFoundError,
  ValidationError,
  ServiceError,
  AuthenticationError,
  AuthorizationError,
  ExternalApiError,
  RateLimitError,
  TimeoutError,
};
