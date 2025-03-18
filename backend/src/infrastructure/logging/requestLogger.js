/**
 * Middleware para logging de requisições HTTP
 */
const { createServiceLogger } = require('./logger');
const httpLogger = createServiceLogger('http');

/**
 * Middleware para logging de requisições HTTP
 */
exports.requestLogger = (req, res, next) => {
  // Registrar início da requisição
  const startTime = Date.now();
  
  // Capturar informações básicas da requisição
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id || 'anonymous',
    correlationId: req.headers['x-correlation-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
  };
  
  // Adicionar correlationId à requisição para rastreabilidade
  req.correlationId = requestInfo.correlationId;
  
  // Modificar o objeto response para capturar o código de status
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);
    
    // Calcular tempo de resposta
    const responseTime = Date.now() - startTime;
    
    // Registrar detalhes da resposta
    const responseInfo = {
      ...requestInfo,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`
    };
    
    // Escolher nível de log de acordo com o status code
    if (res.statusCode >= 500) {
      httpLogger.error('Requisição com erro de servidor', responseInfo);
    } else if (res.statusCode >= 400) {
      httpLogger.warn('Requisição com erro do cliente', responseInfo);
    } else {
      httpLogger.info('Requisição concluída', responseInfo);
    }
  };
  
  // Registrar início da requisição em nível debug
  httpLogger.debug('Requisição recebida', requestInfo);
  
  next();
};
