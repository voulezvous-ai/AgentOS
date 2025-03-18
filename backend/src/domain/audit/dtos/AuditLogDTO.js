/**
 * DTOs para AuditLog
 * Objetos de transferência de dados para comunicação entre camadas
 */

/**
 * Converte um modelo de domínio AuditLog para DTO
 * @param {AuditLog} auditLog Objeto AuditLog do domínio
 * @returns {Object} DTO para transferência de dados
 */
const toDTO = (auditLog) => {
  if (!auditLog) return null;

  return {
    id: auditLog.id,
    eventType: auditLog.eventType,
    eventSource: auditLog.eventSource,
    userId: auditLog.userId,
    resourceType: auditLog.resourceType,
    resourceId: auditLog.resourceId,
    action: auditLog.action,
    outcome: auditLog.outcome,
    severity: auditLog.severity,
    details: sanitizeDetails(auditLog.details),
    metadata: auditLog.metadata,
    ipAddress: auditLog.ipAddress,
    sessionId: auditLog.sessionId,
    timestamp: auditLog.timestamp,
    correlationId: auditLog.correlationId
  };
};

/**
 * Converte um array de modelos AuditLog para array de DTOs
 * @param {Array<AuditLog>} auditLogs Array de objetos AuditLog
 * @returns {Array<Object>} Array de DTOs
 */
const toDTOList = (auditLogs) => {
  if (!Array.isArray(auditLogs)) return [];
  return auditLogs.map(toDTO);
};

/**
 * DTO para detalhes resumidos do log de auditoria
 * @param {AuditLog} auditLog Objeto AuditLog do domínio
 * @returns {Object} DTO resumido
 */
const toSummaryDTO = (auditLog) => {
  if (!auditLog) return null;

  return {
    id: auditLog.id,
    eventType: auditLog.eventType,
    eventSource: auditLog.eventSource,
    userId: auditLog.userId,
    resourceType: auditLog.resourceType,
    resourceId: auditLog.resourceId,
    action: auditLog.action,
    outcome: auditLog.outcome,
    severity: auditLog.severity,
    timestamp: auditLog.timestamp
  };
};

/**
 * Converte um array de modelos AuditLog para array de DTOs resumidos
 * @param {Array<AuditLog>} auditLogs Array de objetos AuditLog
 * @returns {Array<Object>} Array de DTOs resumidos
 */
const toSummaryDTOList = (auditLogs) => {
  if (!Array.isArray(auditLogs)) return [];
  return auditLogs.map(toSummaryDTO);
};

/**
 * DTO para eventos de segurança
 * @param {AuditLog} auditLog Objeto AuditLog do domínio
 * @returns {Object} DTO de evento de segurança
 */
const toSecurityEventDTO = (auditLog) => {
  if (!auditLog) return null;

  // Apenas eventos com severidade WARNING ou superior são considerados eventos de segurança
  const securitySeverities = ['WARNING', 'ERROR', 'CRITICAL'];
  if (!securitySeverities.includes(auditLog.severity)) {
    return null;
  }

  return {
    id: auditLog.id,
    eventType: auditLog.eventType,
    eventSource: auditLog.eventSource,
    userId: auditLog.userId,
    resourceType: auditLog.resourceType,
    resourceId: auditLog.resourceId,
    action: auditLog.action,
    severity: auditLog.severity,
    ipAddress: auditLog.ipAddress,
    details: sanitizeDetails(auditLog.details),
    timestamp: auditLog.timestamp
  };
};

/**
 * Sanitiza detalhes sensíveis para inclusão no DTO
 * @private
 * @param {Object} details Detalhes do log
 * @returns {Object} Detalhes sanitizados
 */
function sanitizeDetails(details) {
  if (!details) return {};

  const sensitiveFields = [
    'password', 'senha', 'secret', 'token', 'apiKey', 'key', 
    'creditCard', 'cartao', 'card', 'cvv', 'ssn', 'social'
  ];
  
  // Função recursiva para sanitizar objetos
  const sanitizeObj = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result = { ...obj };
    
    for (const key in result) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        result[key] = '[REDACTED]';
      } else if (typeof result[key] === 'object') {
        result[key] = sanitizeObj(result[key]);
      }
    }
    
    return result;
  };
  
  return sanitizeObj(details);
}

module.exports = {
  toDTO,
  toDTOList,
  toSummaryDTO,
  toSummaryDTOList,
  toSecurityEventDTO
};
