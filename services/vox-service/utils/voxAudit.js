/**
 * Vox Audit
 * Sistema específico de auditoria para o Vox Service
 */

const AuditLogger = require('../../../common/utils/auditLogger');
const { logger } = require('../../../common/config/logger');

// Criar instância do logger de auditoria específico para o Vox
const voxAudit = new AuditLogger('vox-service', {
  mongoEnabled: true,
  consoleEnabled: process.env.NODE_ENV !== 'production',
  fileEnabled: true
});

// Tipos de eventos específicos do Vox
const VOX_EVENTS = {
  // Eventos de processamento de comandos
  COMMAND_RECEIVED: 'command_received',
  COMMAND_PROCESSED: 'command_processed',
  COMMAND_FAILED: 'command_failed',
  
  // Eventos de análise de intenção
  INTENT_ANALYZED: 'intent_analyzed',
  INTENT_UNKNOWN: 'intent_unknown',
  
  // Eventos de ações
  ACTION_EXECUTED: 'action_executed',
  ACTION_FAILED: 'action_failed',
  
  // Eventos de escalonamento
  ESCALATION_CREATED: 'escalation_created',
  ESCALATION_APPROVED: 'escalation_approved',
  ESCALATION_REJECTED: 'escalation_rejected',
  
  // Eventos de usuário
  USER_INTERACTION: 'user_interaction',
  USER_FEEDBACK: 'user_feedback',
  
  // Eventos de segurança
  PERMISSION_DENIED: 'permission_denied',
  ACCESS_ATTEMPT: 'access_attempt',
  
  // Eventos de performance
  AI_REQUEST: 'ai_request',
  API_CALL: 'api_call'
};

// Exportar eventos
exports.EVENTS = VOX_EVENTS;

/**
 * Registra atividade de comando recebido
 * @param {String} userId - ID do usuário
 * @param {String} commandType - Tipo de comando (text/voice)
 * @param {String} query - Texto do comando
 * @param {Object} metadata - Metadados adicionais
 * @returns {String} ID de auditoria
 */
exports.logCommandReceived = (userId, commandType, query, metadata = {}) => {
  return voxAudit.auditAction(userId, VOX_EVENTS.COMMAND_RECEIVED, {
    commandType,
    query: query.substring(0, 1000), // Limitar tamanho do query
    source: metadata.source || 'api',
    sessionId: metadata.sessionId,
    timestamp: new Date()
  });
};

/**
 * Registra atividade de comando processado com sucesso
 * @param {String} userId - ID do usuário
 * @param {String} commandType - Tipo de comando (text/voice)
 * @param {String} intent - Intenção identificada
 * @param {Object} result - Resultado do processamento
 * @param {Object} metadata - Metadados adicionais
 * @returns {String} ID de auditoria
 */
exports.logCommandProcessed = (userId, commandType, intent, result, metadata = {}) => {
  return voxAudit.auditAction(userId, VOX_EVENTS.COMMAND_PROCESSED, {
    commandType,
    intent,
    result: typeof result === 'object' ? result : { message: result },
    responseTime: metadata.responseTime,
    sessionId: metadata.sessionId,
    timestamp: new Date()
  });
};

/**
 * Registra falha no processamento de comando
 * @param {String} userId - ID do usuário
 * @param {String} commandType - Tipo de comando (text/voice)
 * @param {String} query - Texto do comando
 * @param {Error} error - Erro ocorrido
 * @param {Object} metadata - Metadados adicionais
 * @returns {String} ID de auditoria
 */
exports.logCommandFailed = (userId, commandType, query, error, metadata = {}) => {
  return voxAudit.auditAction(userId, VOX_EVENTS.COMMAND_FAILED, {
    commandType,
    query: query.substring(0, 1000),
    error: {
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      code: error.code
    },
    sessionId: metadata.sessionId,
    timestamp: new Date()
  }, 'failure');
};

/**
 * Registra análise de intenção
 * @param {String} userId - ID do usuário
 * @param {String} query - Texto do comando
 * @param {Object} intentAnalysis - Análise da intenção
 * @param {Object} metadata - Metadados adicionais
 * @returns {String} ID de auditoria
 */
exports.logIntentAnalyzed = (userId, query, intentAnalysis, metadata = {}) => {
  return voxAudit.auditAction(userId, VOX_EVENTS.INTENT_ANALYZED, {
    query: query.substring(0, 1000),
    intent: intentAnalysis.intent,
    confidence: intentAnalysis.confidence,
    parameters: intentAnalysis.parameters || {},
    responseTime: metadata.responseTime,
    sessionId: metadata.sessionId,
    timestamp: new Date()
  });
};

/**
 * Registra execução de ação
 * @param {String} userId - ID do usuário
 * @param {String} intent - Intenção/ação
 * @param {Object} actionParams - Parâmetros da ação
 * @param {Object} result - Resultado da ação
 * @param {Object} metadata - Metadados adicionais
 * @returns {String} ID de auditoria
 */
exports.logActionExecuted = (userId, intent, actionParams, result, metadata = {}) => {
  return voxAudit.auditAction(userId, VOX_EVENTS.ACTION_EXECUTED, {
    intent,
    actionParams,
    result,
    criticality: metadata.criticality || 'low',
    department: metadata.department,
    responseTime: metadata.responseTime,
    sessionId: metadata.sessionId,
    timestamp: new Date()
  });
};

/**
 * Registra falha na execução de ação
 * @param {String} userId - ID do usuário
 * @param {String} intent - Intenção/ação
 * @param {Object} actionParams - Parâmetros da ação
 * @param {Error} error - Erro ocorrido
 * @param {Object} metadata - Metadados adicionais
 * @returns {String} ID de auditoria
 */
exports.logActionFailed = (userId, intent, actionParams, error, metadata = {}) => {
  return voxAudit.auditAction(userId, VOX_EVENTS.ACTION_FAILED, {
    intent,
    actionParams,
    error: {
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      code: error.code
    },
    criticality: metadata.criticality || 'low',
    department: metadata.department,
    sessionId: metadata.sessionId,
    timestamp: new Date()
  }, 'failure');
};

/**
 * Registra criação de escalonamento
 * @param {String} userId - ID do usuário
 * @param {String} intent - Intenção/ação escalonada
 * @param {String} escalationId - ID do escalonamento
 * @param {String} escalateTo - Perfil para quem foi escalonado
 * @param {Object} metadata - Metadados adicionais
 * @returns {String} ID de auditoria
 */
exports.logEscalationCreated = (userId, intent, escalationId, escalateTo, metadata = {}) => {
  return voxAudit.auditAction(userId, VOX_EVENTS.ESCALATION_CREATED, {
    intent,
    escalationId,
    escalateTo,
    department: metadata.department,
    reason: metadata.reason || 'Permissão insuficiente',
    criticality: metadata.criticality || 'medium',
    sessionId: metadata.sessionId,
    timestamp: new Date()
  });
};

/**
 * Registra aprovação de escalonamento
 * @param {String} approverId - ID do aprovador
 * @param {String} escalationId - ID do escalonamento
 * @param {String} originalUserId - ID do usuário original
 * @param {String} intent - Intenção/ação escalonada
 * @param {Object} metadata - Metadados adicionais
 * @returns {String} ID de auditoria
 */
exports.logEscalationApproved = (approverId, escalationId, originalUserId, intent, metadata = {}) => {
  return voxAudit.auditAction(approverId, VOX_EVENTS.ESCALATION_APPROVED, {
    escalationId,
    originalUserId,
    intent,
    department: metadata.department,
    comments: metadata.comments,
    timestamp: new Date()
  });
};

/**
 * Registra rejeição de escalonamento
 * @param {String} approverId - ID do aprovador
 * @param {String} escalationId - ID do escalonamento
 * @param {String} originalUserId - ID do usuário original
 * @param {String} intent - Intenção/ação escalonada
 * @param {Object} metadata - Metadados adicionais
 * @returns {String} ID de auditoria
 */
exports.logEscalationRejected = (approverId, escalationId, originalUserId, intent, metadata = {}) => {
  return voxAudit.auditAction(approverId, VOX_EVENTS.ESCALATION_REJECTED, {
    escalationId,
    originalUserId,
    intent,
    department: metadata.department,
    reason: metadata.reason,
    comments: metadata.comments,
    timestamp: new Date()
  });
};

/**
 * Registra negação de permissão
 * @param {String} userId - ID do usuário
 * @param {String} action - Ação tentada
 * @param {String} requiredPermission - Permissão necessária
 * @param {Object} metadata - Metadados adicionais
 * @returns {String} ID de auditoria
 */
exports.logPermissionDenied = (userId, action, requiredPermission, metadata = {}) => {
  return voxAudit.logSecurity(userId, VOX_EVENTS.PERMISSION_DENIED, {
    action,
    requiredPermission,
    userPermissions: metadata.userPermissions || [],
    criticality: metadata.criticality || 'medium',
    sessionId: metadata.sessionId,
    timestamp: new Date()
  }, 'warning');
};

/**
 * Registra requisição à API de IA
 * @param {String} provider - Provedor da API (ex: OpenAI)
 * @param {String} model - Modelo utilizado
 * @param {Object} requestParams - Parâmetros da requisição (sanitizados)
 * @param {Number} responseTime - Tempo de resposta em ms
 * @param {Object} metadata - Metadados adicionais
 * @returns {String} ID de auditoria
 */
exports.logAIRequest = (provider, model, requestParams, responseTime, metadata = {}) => {
  const timerId = voxAudit.startPerformanceTimer(`AI_REQUEST_${provider}`);
  
  // Sanitizar requisição
  const sanitizedParams = { ...requestParams };
  if (sanitizedParams.prompt) {
    sanitizedParams.prompt = sanitizedParams.prompt.substring(0, 200) + '...';
  }
  if (sanitizedParams.messages) {
    sanitizedParams.messages = sanitizedParams.messages.map(m => ({
      ...m,
      content: m.content.substring(0, 200) + '...'
    }));
  }
  
  const result = voxAudit.auditSystem('AI', VOX_EVENTS.AI_REQUEST, {
    provider,
    model,
    requestParams: sanitizedParams,
    responseTime,
    tokensUsed: metadata.tokensUsed,
    userId: metadata.userId,
    sessionId: metadata.sessionId,
    timestamp: new Date()
  });
  
  voxAudit.endPerformanceTimer(timerId, { 
    responseTime, 
    model, 
    tokensUsed: metadata.tokensUsed 
  });
  
  return result;
};

/**
 * Iniciar timer de performance para uma operação
 * @param {String} operation - Nome da operação
 * @param {Object} context - Contexto da operação
 * @returns {String} ID do timer
 */
exports.startTimer = (operation, context = {}) => {
  return voxAudit.startPerformanceTimer(operation, context);
};

/**
 * Finalizar timer de performance
 * @param {String} timerId - ID do timer iniciado
 * @param {Object} additionalContext - Contexto adicional
 * @returns {Number} Duração em ms
 */
exports.endTimer = (timerId, additionalContext = {}) => {
  return voxAudit.endPerformanceTimer(timerId, additionalContext);
};

// Exportar o logger completo para funções adicionais
exports.logger = voxAudit;
