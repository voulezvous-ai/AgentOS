/**
 * Middleware de autenticação
 * Valida o token JWT fornecido no cabeçalho Authorization
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { logger } = require('../utils/logger');

/**
 * Middleware para verificar e validar o token JWT
 */
const authMiddleware = (req, res, next) => {
  // Pula autenticação em ambiente de desenvolvimento se configurado
  if (config.app.env === 'development' && config.security.disableAuthInDev) {
    return next();
  }

  // Obtém o token do cabeçalho ou query
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : req.query?.token;
  
  if (!token) {
    logger.warn('Tentativa de acesso sem token');
    return res.status(401).json({ error: 'Acesso não autorizado. Token não fornecido.' });
  }
  
  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, config.security.jwtSecret);
    
    // Adiciona usuário à requisição
    req.user = decoded;
    
    // Verifica permissões se necessário
    if (config.security.enforcePermissions && req.user.permissions) {
      // Verifica se usuário tem permissão para esta rota
      // Esta é uma implementação simplificada
      const { path, method } = req;
      const hasPermission = checkPermission(req.user.permissions, path, method);
      
      if (!hasPermission) {
        logger.warn(`Acesso negado: ${req.user.username} tentou acessar ${method} ${path}`);
        return res.status(403).json({ 
          error: 'Acesso negado. Permissões insuficientes.' 
        });
      }
    }
    
    next();
  } catch (error) {
    logger.warn(`Erro na autenticação: ${error.message}`);
    
    // Verifica o tipo de erro
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado.' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    return res.status(401).json({ error: 'Falha na autenticação.' });
  }
};

/**
 * Verifica se o usuário tem permissão para acessar a rota
 * @param {Array} permissions - Permissões do usuário
 * @param {string} path - Caminho da requisição
 * @param {string} method - Método HTTP
 * @returns {boolean} Resultado da verificação
 */
const checkPermission = (permissions, path, method) => {
  // Esta é uma implementação simplificada
  // Em um sistema real, você teria um sistema mais robusto de permissões
  
  // Se o usuário tem permissão de admin, permite tudo
  if (permissions.includes('admin') || permissions.includes('whatsapp:admin')) {
    return true;
  }
  
  // Permissões específicas para rotas de WhatsApp
  if (path.includes('/clients')) {
    if (method === 'GET' && permissions.includes('whatsapp:read')) {
      return true;
    }
    if ((method === 'POST' || method === 'PUT' || method === 'DELETE') 
        && permissions.includes('whatsapp:write')) {
      return true;
    }
  }
  
  if (path.includes('/messages')) {
    if (method === 'GET' && permissions.includes('whatsapp:read')) {
      return true;
    }
    if ((method === 'POST' || method === 'PUT' || method === 'DELETE') 
        && permissions.includes('whatsapp:write')) {
      return true;
    }
  }
  
  return false;
};

module.exports = authMiddleware;
