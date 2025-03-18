/**
 * Serviço de domínio de auditoria
 * Fornece funcionalidades para registrar e pesquisar logs de auditoria
 */
const { AuditLog, AUDIT_EVENT_TYPES, AUDIT_SEVERITY } = require('../entities/AuditLog');
const { DomainError } = require('../../core/exceptions');

class AuditService {
  /**
   * @param {import('../repositories/AuditLogRepository')} auditLogRepository Repositório de logs de auditoria
   * @param {Object} options Opções de configuração
   * @param {boolean} options.enabledSecurity Habilitar recursos de segurança avançados
   * @param {boolean} options.enableDetection Habilitar detecção de atividades suspeitas
   * @param {boolean} options.enableVerbose Registrar logs verbosos
   */
  constructor(auditLogRepository, options = {}) {
    this.auditLogRepository = auditLogRepository;
    this.options = {
      enabledSecurity: true,
      enableDetection: true,
      enableVerbose: false,
      ...options
    };
  }

  /**
   * Registra um evento de auditoria
   * @param {AuditLog} auditLog Log de auditoria a ser registrado
   * @returns {Promise<AuditLog>} Log de auditoria registrado
   */
  async recordEvent(auditLog) {
    // Validar o log de auditoria
    if (!auditLog || !auditLog.eventType) {
      throw new DomainError('Evento de auditoria inválido', 'INVALID_AUDIT_EVENT');
    }
    
    // Adicionar detalhes do sistema
    auditLog.addSystemDetails({
      hostName: process.env.HOSTNAME || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      component: 'AgentOS-Backend',
      apiVersion: process.env.API_VERSION || '1.0'
    });
    
    // Registrar o log
    const recordedLog = await this.auditLogRepository.record(auditLog);
    
    // Verificar se é preciso detectar atividades suspeitas
    if (this.options.enableDetection && this._shouldAnalyzeForSuspiciousActivity(auditLog)) {
      this._analyzeForSuspiciousActivity(auditLog);
    }
    
    return recordedLog;
  }

  /**
   * Registra evento de autenticação
   * @param {string} userId ID do usuário
   * @param {string} username Nome do usuário
   * @param {boolean} success Indica se a autenticação foi bem-sucedida
   * @param {string} ipAddress Endereço IP
   * @param {Object} details Detalhes adicionais
   * @returns {Promise<AuditLog>} Log de auditoria registrado
   */
  async recordAuthentication(userId, username, success, ipAddress, details = {}) {
    const eventType = success ? 
      AUDIT_EVENT_TYPES.AUTHENTICATION_SUCCESS : 
      AUDIT_EVENT_TYPES.AUTHENTICATION_FAILURE;
    
    const auditLog = new AuditLog({
      eventType,
      eventSource: 'auth-service',
      userId,
      resourceType: 'user',
      resourceId: userId,
      action: 'authenticate',
      outcome: success ? 'success' : 'failure',
      severity: success ? AUDIT_SEVERITY.INFO : AUDIT_SEVERITY.WARNING,
      ipAddress,
      details: {
        username,
        method: details.method || 'password',
        userAgent: details.userAgent,
        ...details
      }
    });
    
    return this.recordEvent(auditLog);
  }

  /**
   * Registra evento de autorização
   * @param {string} userId ID do usuário
   * @param {string} resource Recurso acessado
   * @param {string} action Ação tentada
   * @param {boolean} permitted Se o acesso foi permitido
   * @param {Object} details Detalhes adicionais
   * @returns {Promise<AuditLog>} Log de auditoria registrado
   */
  async recordAuthorization(userId, resource, action, permitted, details = {}) {
    const eventType = permitted ? 
      AUDIT_EVENT_TYPES.AUTHORIZATION_SUCCESS : 
      AUDIT_EVENT_TYPES.AUTHORIZATION_FAILURE;
    
    const auditLog = new AuditLog({
      eventType,
      eventSource: 'auth-service',
      userId,
      resourceType: details.resourceType || 'endpoint',
      resourceId: resource,
      action,
      outcome: permitted ? 'success' : 'failure',
      severity: permitted ? AUDIT_SEVERITY.INFO : AUDIT_SEVERITY.WARNING,
      ipAddress: details.ipAddress,
      details: {
        requiredPermissions: details.requiredPermissions,
        userPermissions: details.userPermissions,
        ...details
      }
    });
    
    return this.recordEvent(auditLog);
  }

  /**
   * Registra evento de comando de voz
   * @param {string} userId ID do usuário
   * @param {string} commandId ID do comando
   * @param {string} query Consulta/comando original
   * @param {Object} intentData Dados da intenção reconhecida
   * @param {string} sessionId ID da sessão
   * @returns {Promise<AuditLog>} Log de auditoria registrado
   */
  async recordVoxCommand(userId, commandId, query, intentData, sessionId) {
    const auditLog = new AuditLog({
      eventType: AUDIT_EVENT_TYPES.VOX_COMMAND_RECEIVED,
      eventSource: 'vox-service',
      userId,
      resourceType: 'command',
      resourceId: commandId,
      action: 'process_command',
      severity: AUDIT_SEVERITY.INFO,
      details: {
        query,
        intent: intentData.intent,
        confidence: intentData.confidence,
        entities: intentData.entities
      },
      sessionId
    });
    
    return this.recordEvent(auditLog);
  }

  /**
   * Registra execução de ação pelo Vox
   * @param {string} userId ID do usuário
   * @param {string} actionId ID da ação
   * @param {string} actionName Nome da ação
   * @param {Object} result Resultado da execução
   * @param {Object} details Detalhes adicionais
   * @returns {Promise<AuditLog>} Log de auditoria registrado
   */
  async recordVoxAction(userId, actionId, actionName, result, details = {}) {
    const success = result && result.success === true;
    
    // Determinar severidade com base na criticidade
    let severity = AUDIT_SEVERITY.INFO;
    if (details.criticality === 'high') {
      severity = AUDIT_SEVERITY.NOTICE;
    } else if (details.criticality === 'critical') {
      severity = AUDIT_SEVERITY.WARNING;
    }
    
    // Se falhou, aumentar a severidade
    if (!success) {
      severity = this._incrementSeverity(severity);
    }
    
    const auditLog = new AuditLog({
      eventType: success ? 
        AUDIT_EVENT_TYPES.VOX_ACTION_EXECUTED : 
        AUDIT_EVENT_TYPES.VOX_ACTION_FAILED,
      eventSource: 'vox-service',
      userId,
      resourceType: 'action',
      resourceId: actionId,
      action: actionName,
      outcome: success ? 'success' : 'failure',
      severity,
      details: {
        department: details.department,
        criticality: details.criticality,
        params: details.params,
        result,
        executionTime: details.executionTime
      },
      sessionId: details.sessionId
    });
    
    return this.recordEvent(auditLog);
  }

  /**
   * Registra evento de escalação de ação
   * @param {string} userId ID do usuário solicitante
   * @param {string} escalationId ID da escalação
   * @param {string} actionId ID da ação
   * @param {string} actionName Nome da ação
   * @param {Array<string>} approvers Aprovadores
   * @param {Object} details Detalhes adicionais
   * @returns {Promise<AuditLog>} Log de auditoria registrado
   */
  async recordEscalation(userId, escalationId, actionId, actionName, approvers, details = {}) {
    const auditLog = new AuditLog({
      eventType: AUDIT_EVENT_TYPES.ESCALATION_CREATED,
      eventSource: 'vox-service',
      userId,
      resourceType: 'escalation',
      resourceId: escalationId,
      action: 'create_escalation',
      severity: AUDIT_SEVERITY.NOTICE,
      details: {
        actionId,
        actionName,
        department: details.department,
        criticality: details.criticality,
        priority: details.priority,
        approvers,
        expiresAt: details.expiresAt
      },
      sessionId: details.sessionId
    });
    
    return this.recordEvent(auditLog);
  }

  /**
   * Registra evento de aprovação de escalação
   * @param {string} approverId ID do aprovador
   * @param {string} escalationId ID da escalação
   * @param {string} actionId ID da ação
   * @param {string} userId ID do usuário original
   * @param {Object} details Detalhes adicionais
   * @returns {Promise<AuditLog>} Log de auditoria registrado
   */
  async recordEscalationApproval(approverId, escalationId, actionId, userId, details = {}) {
    const auditLog = new AuditLog({
      eventType: AUDIT_EVENT_TYPES.ESCALATION_APPROVED,
      eventSource: 'vox-service',
      userId: approverId,
      resourceType: 'escalation',
      resourceId: escalationId,
      action: 'approve_escalation',
      severity: AUDIT_SEVERITY.NOTICE,
      details: {
        actionId,
        requestedBy: userId,
        approvalNotes: details.notes,
        ...details
      }
    });
    
    return this.recordEvent(auditLog);
  }

  /**
   * Registra evento de rejeição de escalação
   * @param {string} rejecterId ID do rejeitador
   * @param {string} escalationId ID da escalação
   * @param {string} actionId ID da ação
   * @param {string} userId ID do usuário original
   * @param {string} reason Motivo da rejeição
   * @param {Object} details Detalhes adicionais
   * @returns {Promise<AuditLog>} Log de auditoria registrado
   */
  async recordEscalationRejection(rejecterId, escalationId, actionId, userId, reason, details = {}) {
    const auditLog = new AuditLog({
      eventType: AUDIT_EVENT_TYPES.ESCALATION_REJECTED,
      eventSource: 'vox-service',
      userId: rejecterId,
      resourceType: 'escalation',
      resourceId: escalationId,
      action: 'reject_escalation',
      severity: AUDIT_SEVERITY.NOTICE,
      details: {
        actionId,
        requestedBy: userId,
        reason,
        ...details
      }
    });
    
    return this.recordEvent(auditLog);
  }

  /**
   * Registra erro de sistema
   * @param {Error} error Erro ocorrido
   * @param {string} component Componente onde ocorreu o erro
   * @param {string} userId ID do usuário (se disponível)
   * @param {Object} context Contexto adicional
   * @returns {Promise<AuditLog>} Log de auditoria registrado
   */
  async recordSystemError(error, component, userId = null, context = {}) {
    const auditLog = new AuditLog({
      eventType: AUDIT_EVENT_TYPES.SYSTEM_ERROR,
      eventSource: component,
      userId,
      resourceType: context.resourceType || 'system',
      resourceId: context.resourceId || component,
      action: context.action || 'system_operation',
      outcome: 'failure',
      severity: AUDIT_SEVERITY.ERROR,
      details: {
        error: {
          message: error.message,
          name: error.name,
          stack: this.options.enabledSecurity ? undefined : error.stack,
          code: error.code
        },
        context
      },
      sessionId: context.sessionId
    });
    
    return this.recordEvent(auditLog);
  }

  /**
   * Registra alteração de dados sensíveis
   * @param {string} userId ID do usuário
   * @param {string} resourceType Tipo de recurso
   * @param {string} resourceId ID do recurso
   * @param {string} action Ação realizada
   * @param {Object} changes Mudanças realizadas
   * @param {Object} details Detalhes adicionais
   * @returns {Promise<AuditLog>} Log de auditoria registrado
   */
  async recordSensitiveDataChange(userId, resourceType, resourceId, action, changes, details = {}) {
    const auditLog = new AuditLog({
      eventType: AUDIT_EVENT_TYPES.SENSITIVE_DATA_MODIFIED,
      eventSource: details.source || 'data-service',
      userId,
      resourceType,
      resourceId,
      action,
      severity: AUDIT_SEVERITY.WARNING,
      details: {
        changes: this._sanitizeSensitiveData(changes),
        ...details
      },
      ipAddress: details.ipAddress
    });
    
    return this.recordEvent(auditLog);
  }
  
  /**
   * Busca logs por critérios
   * @param {Object} criteria Critérios de busca
   * @param {Object} options Opções de paginação
   * @returns {Promise<Object>} Resultado da pesquisa
   */
  async searchLogs(criteria, options = {}) {
    return this.auditLogRepository.search(criteria, options);
  }

  /**
   * Obtém logs por ID de usuário
   * @param {string} userId ID do usuário
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<AuditLog>>} Logs encontrados
   */
  async getUserLogs(userId, options = {}) {
    return this.auditLogRepository.findByUserId(userId, options);
  }

  /**
   * Obtém logs por tipo de evento
   * @param {string|Array<string>} eventTypes Tipos de evento
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<AuditLog>>} Logs encontrados
   */
  async getEventLogs(eventTypes, options = {}) {
    if (Array.isArray(eventTypes)) {
      // Múltiplos tipos de evento
      return this.auditLogRepository.search({ eventTypes }, options);
    }
    
    // Tipo único
    return this.auditLogRepository.findByEventType(eventTypes, options);
  }

  /**
   * Obtém logs por recurso
   * @param {string} resourceId ID do recurso
   * @param {string} resourceType Tipo do recurso
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<AuditLog>>} Logs encontrados
   */
  async getResourceLogs(resourceId, resourceType, options = {}) {
    return this.auditLogRepository.findByResourceId(resourceId, resourceType, options);
  }

  /**
   * Obtém logs de sessão
   * @param {string} sessionId ID da sessão
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<AuditLog>>} Logs encontrados
   */
  async getSessionLogs(sessionId, options = {}) {
    return this.auditLogRepository.findBySessionId(sessionId, options);
  }

  /**
   * Obtém logs de período específico
   * @param {Date} startDate Data inicial
   * @param {Date} endDate Data final
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<AuditLog>>} Logs encontrados
   */
  async getLogsByDateRange(startDate, endDate, options = {}) {
    return this.auditLogRepository.findByTimeRange(startDate, endDate, options);
  }

  /**
   * Obtém estatísticas de auditoria
   * @param {Object} params Parâmetros para estatísticas
   * @returns {Promise<Object>} Estatísticas
   */
  async getAuditStatistics(params = {}) {
    const defaultGroupings = ['eventType', 'severity', 'outcome'];
    const groupBy = params.groupBy || defaultGroupings[0];
    
    return this.auditLogRepository.getStatistics(groupBy, params.filters, params.options);
  }

  /**
   * Remove logs antigos
   * @param {number} days Dias para manter logs (remover mais antigos que isso)
   * @returns {Promise<number>} Número de logs removidos
   */
  async pruneOldLogs(days = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.auditLogRepository.pruneOldLogs(cutoffDate);
  }

  // Métodos privados auxiliares

  /**
   * Verifica se deve analisar o log em busca de atividade suspeita
   * @private
   * @param {AuditLog} auditLog Log de auditoria
   * @returns {boolean} Verdadeiro se deve analisar
   */
  _shouldAnalyzeForSuspiciousActivity(auditLog) {
    // Configurar quais eventos devem ser analisados
    const eventsToAnalyze = [
      AUDIT_EVENT_TYPES.AUTHENTICATION_FAILURE,
      AUDIT_EVENT_TYPES.AUTHORIZATION_FAILURE,
      AUDIT_EVENT_TYPES.SENSITIVE_DATA_MODIFIED,
      AUDIT_EVENT_TYPES.PERMISSION_CHANGED,
      AUDIT_EVENT_TYPES.USER_ROLE_CHANGED,
      AUDIT_EVENT_TYPES.ESCALATION_REJECTED,
      AUDIT_EVENT_TYPES.CONFIGURATION_CHANGED
    ];

    return eventsToAnalyze.includes(auditLog.eventType);
  }

  /**
   * Analisa log em busca de atividade suspeita
   * @private
   * @param {AuditLog} auditLog Log de auditoria
   */
  _analyzeForSuspiciousActivity(auditLog) {
    // Implementação real iria integrar com um serviço de detecção de anomalias
    // Para esta demonstração, simplesmente logamos que uma análise ocorreria
    console.log(`[Security Analysis] Analyzing audit log ${auditLog.id} for suspicious activity`);

    // Exemplo de um possível padrão de análise:
    if (auditLog.eventType === AUDIT_EVENT_TYPES.AUTHENTICATION_FAILURE) {
      // Aqui notificaríamos um serviço externo para verificar possíveis tentativas de força bruta
      console.log(`[Security Alert] Authentication failure detected for user ${auditLog.userId || 'unknown'}`);
    }
  }

  /**
   * Aumenta o nível de severidade em um grau
   * @private
   * @param {string} severity Severidade atual
   * @returns {string} Severidade aumentada
   */
  _incrementSeverity(severity) {
    const levels = Object.values(AUDIT_SEVERITY);
    const currentIndex = levels.indexOf(severity);
    
    if (currentIndex >= 0 && currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    
    return severity;
  }

  /**
   * Limpa dados sensíveis para o log
   * @private
   * @param {Object} changes Mudanças a serem sanitizadas
   * @returns {Object} Dados sanitizados
   */
  _sanitizeSensitiveData(changes) {
    if (!changes) return {};
    
    const sensitiveFields = [
      'password', 'senha', 'secret', 'token', 'apiKey', 'creditCard',
      'cartao', 'card', 'cvv', 'ssn', 'social'
    ];
    
    const sanitized = { ...changes };
    
    // Função recursiva para sanitizar propriedades aninhadas
    const sanitizeObj = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const result = { ...obj };
      
      for (const key in result) {
        const lowerKey = key.toLowerCase();
        // Verificar se é campo sensível
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          result[key] = '[REDACTED]';
        } else if (typeof result[key] === 'object') {
          // Recursivamente sanitizar objetos aninhados
          result[key] = sanitizeObj(result[key]);
        }
      }
      
      return result;
    };
    
    return sanitizeObj(sanitized);
  }
}

module.exports = AuditService;
