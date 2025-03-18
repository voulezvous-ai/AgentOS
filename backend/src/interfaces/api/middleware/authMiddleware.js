/**
 * Middleware de autenticação para proteger rotas da API
 */
const jwt = require('jsonwebtoken');
const { AuthError } = require('../../../domain/core/exceptions');
const { logger } = require('../../../infrastructure/logging/logger');

/**
 * Middleware para verificar e validar tokens JWT
 */
exports.authMiddleware = (req, res, next) => {
  try {
    // Extrair o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Token de autenticação não fornecido', 'AUTH_TOKEN_MISSING');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AuthError('Formato de token inválido', 'AUTH_TOKEN_INVALID');
    }
    
    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adicionar informações do usuário ao objeto de requisição
    req.user = {
      id: decoded.userId,
      roles: decoded.roles || [],
      permissions: decoded.permissions || []
    };
    
    // Adicionar informações para auditoria
    req.audit = {
      userId: decoded.userId,
      username: decoded.username,
      sessionId: decoded.sessionId
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthError('Token inválido', 'AUTH_TOKEN_INVALID'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new AuthError('Token expirado', 'AUTH_TOKEN_EXPIRED'));
    }
    
    // Se já for um AuthError, apenas passa adiante
    if (error instanceof AuthError) {
      return next(error);
    }
    
    // Outros erros inesperados
    logger.error('Erro inesperado na autenticação', { 
      error: { message: error.message, stack: error.stack } 
    });
    
    return next(new AuthError('Erro de autenticação', 'AUTH_ERROR'));
  }
};

/**
 * Middleware para verificar permissões de usuário
 * 
 * @param {string|string[]} requiredPermissions - Permissão ou array de permissões necessárias
 * @returns {Function} Middleware Express
 */
exports.requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.user) {
        throw new AuthError('Usuário não autenticado', 'AUTH_REQUIRED');
      }
      
      const userPermissions = req.user.permissions || [];
      
      // Normalizar para array
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];
      
      // Verificar se o usuário tem alguma das permissões necessárias
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        // Logar tentativa de acesso não autorizado
        logger.warn('Tentativa de acesso sem permissão', {
          userId: req.user.id,
          requiredPermissions: permissions,
          userPermissions,
          path: req.path,
          method: req.method
        });
        
        throw new AuthError('Permissão negada para este recurso', 'PERMISSION_DENIED');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
