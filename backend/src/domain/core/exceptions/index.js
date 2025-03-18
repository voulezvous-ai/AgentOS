/**
 * Hierarquia de exceções para o AgentOS
 * Permite tratamento de erros mais específico e consistente
 */

/**
 * Erro base para todos os erros da aplicação
 */
class BaseError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code || 'UNKNOWN_ERROR';
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erros relacionados à camada de domínio
 * Para regras de negócio violadas, invariantes, etc.
 */
class DomainError extends BaseError {
  constructor(message, code = 'DOMAIN_ERROR', details = null) {
    super(message, code, details);
  }
}

/**
 * Erros relacionados às regras de aplicação
 * Casos de uso, validação de entrada, etc.
 */
class ApplicationError extends BaseError {
  constructor(message, code = 'APPLICATION_ERROR', details = null) {
    super(message, code, details);
  }
}

/**
 * Erros relacionados à infraestrutura
 * Banco de dados, serviços externos, etc.
 */
class InfrastructureError extends BaseError {
  constructor(message, code = 'INFRASTRUCTURE_ERROR', details = null) {
    super(message, code, details);
  }
}

/**
 * Erro específico para autenticação e autorização
 */
class AuthError extends ApplicationError {
  constructor(message, code = 'AUTH_ERROR', details = null) {
    super(message, code, details);
  }
}

/**
 * Erro de validação de dados
 */
class ValidationError extends ApplicationError {
  constructor(message, validationErrors = [], code = 'VALIDATION_ERROR') {
    super(message, code, validationErrors);
  }
}

/**
 * Erro para recursos não encontrados
 */
class NotFoundError extends ApplicationError {
  constructor(message, resource, code = 'NOT_FOUND') {
    super(message, code, { resource });
  }
}

/**
 * Erro para conflitos (ex: duplicatas)
 */
class ConflictError extends ApplicationError {
  constructor(message, resource, code = 'CONFLICT') {
    super(message, code, { resource });
  }
}

/**
 * Erro para operações não permitidas
 */
class ForbiddenError extends ApplicationError {
  constructor(message, code = 'FORBIDDEN', details = null) {
    super(message, code, details);
  }
}

/**
 * Erro para operações de negócio inválidas
 */
class BusinessRuleError extends DomainError {
  constructor(message, rule, code = 'BUSINESS_RULE_VIOLATION') {
    super(message, code, { rule });
  }
}

module.exports = {
  BaseError,
  DomainError,
  ApplicationError,
  InfrastructureError,
  AuthError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BusinessRuleError
};
