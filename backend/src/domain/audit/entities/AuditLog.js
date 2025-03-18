/**
 * Modelo de domínio AuditLog
 * Representa um registro de auditoria para ações no sistema
 */
const { v4: uuidv4 } = require('uuid');
const { DomainError } = require('../../core/exceptions');

// Constantes para tipos de eventos de auditoria
const AUDIT_EVENT_TYPES = {
  COMMAND_RECEIVED: 'command_received',
  INTENT_IDENTIFIED: 'intent_identified',
  PERMISSION_CHECK: 'permission_check',
  ACTION_EXECUTED: 'action_executed',
  ACTION_FAILED: 'action_failed',
  ESCALATION_CREATED: 'escalation_created',
  ESCALATION_APPROVED: 'escalation_approved',
  ESCALATION_REJECTED: 'escalation_rejected',
  USER_AUTHENTICATED: 'user_authenticated',
  DATA_ACCESSED: 'data_accessed',
  DATA_MODIFIED: 'data_modified',
  SYSTEM_ERROR: 'system_error',
  SECURITY_EVENT: 'security_event'
};

// Constantes para níveis de severidade
const AUDIT_SEVERITY = {
  DEBUG: 'debug',
  INFO: 'info',
  NOTICE: 'notice',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

class AuditLog {
  /**
   * @param {Object} props Propriedades do registro de auditoria
   * @param {string} props.id Identificador único do registro
   * @param {string} props.eventType Tipo do evento
   * @param {string} props.eventSource Fonte do evento ('vox', 'user', 'system', etc)
   * @param {string} props.userId ID do usuário associado (se aplicável)
   * @param {string} props.resourceId ID do recurso afetado
   * @param {string} props.resourceType Tipo do recurso
   * @param {string} props.action Ação realizada
   * @param {string} props.outcome Resultado da ação ('success', 'failure', etc)
   * @param {string} props.severity Nível de severidade do evento
   * @param {Object} props.details Detalhes específicos do evento
   * @param {Object} props.metadata Metadados adicionais
   * @param {Date} props.timestamp Momento do evento
   * @param {string} props.sessionId ID da sessão associada
   * @param {string} props.ipAddress Endereço IP associado
   */
  constructor(props) {
    this.id = props.id || uuidv4();
    this.eventType = props.eventType;
    this.eventSource = props.eventSource;
    this.userId = props.userId;
    this.resourceId = props.resourceId;
    this.resourceType = props.resourceType;
    this.action = props.action;
    this.outcome = props.outcome || 'unknown';
    this.severity = props.severity || AUDIT_SEVERITY.INFO;
    this.details = props.details || {};
    this.metadata = props.metadata || {};
    this.timestamp = props.timestamp || new Date();
    this.sessionId = props.sessionId;
    this.ipAddress = props.ipAddress;
    
    this.validate();
  }
  
  /**
   * Valida a integridade do registro de auditoria
   * @throws {DomainError} Se a validação falhar
   */
  validate() {
    if (!this.eventType) {
      throw new DomainError(
        'Tipo de evento é obrigatório',
        'INVALID_AUDIT_EVENT_TYPE'
      );
    }
    
    if (!this.eventSource) {
      throw new DomainError(
        'Fonte do evento é obrigatória',
        'INVALID_AUDIT_EVENT_SOURCE'
      );
    }
    
    if (!Object.values(AUDIT_SEVERITY).includes(this.severity)) {
      throw new DomainError(
        `Nível de severidade inválido. Deve ser um dos seguintes: ${Object.values(AUDIT_SEVERITY).join(', ')}`,
        'INVALID_AUDIT_SEVERITY'
      );
    }
    
    // Validações condicionais
    if (this.eventType === AUDIT_EVENT_TYPES.ACTION_EXECUTED && !this.resourceId) {
      throw new DomainError(
        'ID do recurso é obrigatório para eventos de execução de ação',
        'INVALID_AUDIT_RESOURCE_ID'
      );
    }
  }
  
  /**
   * Adiciona informações sobre erro
   * @param {Error} error Objeto de erro
   * @returns {AuditLog} this para encadeamento
   */
  addError(error) {
    this.details.error = {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    if (this.severity === AUDIT_SEVERITY.INFO) {
      this.severity = AUDIT_SEVERITY.ERROR;
    }
    
    this.outcome = 'failure';
    
    return this;
  }
  
  /**
   * Adiciona detalhes de performance
   * @param {Object} metrics Métricas de performance
   * @returns {AuditLog} this para encadeamento
   */
  addPerformanceMetrics(metrics) {
    this.details.performance = {
      ...metrics,
      measuredAt: new Date()
    };
    
    return this;
  }
  
  /**
   * Marca o evento como sensível, aplicando mascaramento a dados críticos
   * @param {Array<string>} sensitiveFields Campos que contêm dados sensíveis
   * @returns {AuditLog} this para encadeamento
   */
  markSensitive(sensitiveFields) {
    this.metadata.containsSensitiveData = true;
    this.metadata.sensitiveFields = sensitiveFields;
    
    // Aplicar mascaramento nos campos sensíveis
    sensitiveFields.forEach(field => {
      const parts = field.split('.');
      let current = this.details;
      
      // Navegar até o penúltimo nível
      for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]]) {
          current = current[parts[i]];
        } else {
          return; // Campo não encontrado, pular
        }
      }
      
      // Aplicar mascaramento no último nível
      const lastPart = parts[parts.length - 1];
      if (current[lastPart]) {
        current[lastPart] = '***REDACTED***';
      }
    });
    
    return this;
  }
  
  /**
   * Transforma o registro de auditoria em um objeto simples para serialização
   * @returns {Object} Representação simples do registro
   */
  toJSON() {
    return {
      id: this.id,
      eventType: this.eventType,
      eventSource: this.eventSource,
      userId: this.userId,
      resourceId: this.resourceId,
      resourceType: this.resourceType,
      action: this.action,
      outcome: this.outcome,
      severity: this.severity,
      details: this.details,
      metadata: this.metadata,
      timestamp: this.timestamp,
      sessionId: this.sessionId,
      ipAddress: this.ipAddress
    };
  }
  
  /**
   * Cria uma instância de AuditLog a partir de um objeto simples
   * @param {Object} data Dados do registro de auditoria
   * @returns {AuditLog} Nova instância
   */
  static fromJSON(data) {
    return new AuditLog({
      ...data,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
    });
  }
  
  /**
   * Cria um registro de auditoria para recebimento de comando
   * @param {Object} command Comando recebido
   * @param {string} ipAddress Endereço IP da origem
   * @returns {AuditLog} Registro de auditoria
   */
  static createCommandReceivedLog(command, ipAddress) {
    return new AuditLog({
      eventType: AUDIT_EVENT_TYPES.COMMAND_RECEIVED,
      eventSource: 'vox',
      userId: command.userId,
      resourceId: command.id,
      resourceType: 'command',
      action: 'receive',
      outcome: 'success',
      severity: AUDIT_SEVERITY.INFO,
      details: {
        query: command.query,
        type: command.type,
        source: command.source
      },
      sessionId: command.sessionId,
      ipAddress
    });
  }
  
  /**
   * Cria um registro de auditoria para identificação de intenção
   * @param {Object} command Comando processado
   * @param {Object} intent Intenção identificada
   * @returns {AuditLog} Registro de auditoria
   */
  static createIntentIdentifiedLog(command, intent) {
    return new AuditLog({
      eventType: AUDIT_EVENT_TYPES.INTENT_IDENTIFIED,
      eventSource: 'vox',
      userId: command.userId,
      resourceId: command.id,
      resourceType: 'command',
      action: 'identify_intent',
      outcome: 'success',
      severity: AUDIT_SEVERITY.INFO,
      details: {
        intent: intent.name,
        confidence: intent.confidence,
        entities: command.entities
      },
      sessionId: command.sessionId
    });
  }
  
  /**
   * Cria um registro de auditoria para verificação de permissão
   * @param {Object} action Ação verificada
   * @param {Object} permissionResult Resultado da verificação
   * @param {string} userId ID do usuário
   * @returns {AuditLog} Registro de auditoria
   */
  static createPermissionCheckLog(action, permissionResult, userId) {
    return new AuditLog({
      eventType: AUDIT_EVENT_TYPES.PERMISSION_CHECK,
      eventSource: 'vox',
      userId,
      resourceId: action.id,
      resourceType: 'action',
      action: 'check_permission',
      outcome: permissionResult.permitted ? 'success' : 'failure',
      severity: permissionResult.permitted ? AUDIT_SEVERITY.INFO : AUDIT_SEVERITY.NOTICE,
      details: {
        actionName: action.name,
        department: action.department,
        criticality: action.criticality,
        permissionLevel: permissionResult.permissionLevel,
        reason: permissionResult.reason
      }
    });
  }
  
  /**
   * Cria um registro de auditoria para execução de ação
   * @param {Object} action Ação executada
   * @param {string} userId ID do usuário
   * @param {Object} result Resultado da execução
   * @param {number} executionTime Tempo de execução em ms
   * @returns {AuditLog} Registro de auditoria
   */
  static createActionExecutedLog(action, userId, result, executionTime) {
    return new AuditLog({
      eventType: AUDIT_EVENT_TYPES.ACTION_EXECUTED,
      eventSource: 'vox',
      userId,
      resourceId: action.id,
      resourceType: 'action',
      action: action.name,
      outcome: 'success',
      severity: AUDIT_SEVERITY.INFO,
      details: {
        department: action.department,
        criticality: action.criticality,
        params: action.params,
        result,
        executionTime
      }
    });
  }
  
  /**
   * Cria um registro de auditoria para falha de ação
   * @param {Object} action Ação que falhou
   * @param {string} userId ID do usuário
   * @param {Error} error Erro ocorrido
   * @returns {AuditLog} Registro de auditoria
   */
  static createActionFailedLog(action, userId, error) {
    return new AuditLog({
      eventType: AUDIT_EVENT_TYPES.ACTION_FAILED,
      eventSource: 'vox',
      userId,
      resourceId: action.id,
      resourceType: 'action',
      action: action.name,
      outcome: 'failure',
      severity: AUDIT_SEVERITY.WARNING,
      details: {
        department: action.department,
        criticality: action.criticality,
        params: action.params,
        error: {
          message: error.message,
          name: error.name,
          code: error.code
        }
      }
    });
  }
}

// Exportar classe e constantes
module.exports = {
  AuditLog,
  AUDIT_EVENT_TYPES,
  AUDIT_SEVERITY
};
