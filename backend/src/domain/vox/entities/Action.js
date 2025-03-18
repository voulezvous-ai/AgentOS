/**
 * Modelo de domínio Action
 * Representa uma ação que o Vox pode executar
 */
const { v4: uuidv4 } = require('uuid');
const { DomainError } = require('../../core/exceptions');

// Constantes para níveis de criticidade
const CRITICALITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Constantes para departamentos
const DEPARTMENTS = {
  INVENTORY: 'inventory',
  FINANCE: 'finance',
  HR: 'hr',
  SECURITY: 'security',
  GENERAL: 'general',
  SYSTEM: 'system'
};

// Constantes para estados de ação
const ACTION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ESCALATED: 'escalated',
  REJECTED: 'rejected',
  AUTHORIZED: 'authorized',
  CANCELED: 'canceled'
};

class Action {
  /**
   * @param {Object} props Propriedades da ação
   * @param {string} props.id Identificador único da ação
   * @param {string} props.name Nome da ação
   * @param {string} props.description Descrição da ação
   * @param {string} props.department Departamento a que pertence a ação
   * @param {string} props.criticality Nível de criticidade da ação
   * @param {Function} props.handler Função que implementa a ação
   * @param {Array<string>} props.requiredParams Parâmetros necessários para a ação
   * @param {Array<string>} props.allowedRoles Funções que podem autorizar a ação
   * @param {boolean} props.requiresConfirmation Se a ação requer confirmação explícita
   */
  constructor(props) {
    this.id = props.id || uuidv4();
    this.name = props.name;
    this.description = props.description || '';
    this.department = props.department || DEPARTMENTS.GENERAL;
    this.criticality = props.criticality || CRITICALITY_LEVELS.LOW;
    this.handler = props.handler;
    this.requiredParams = props.requiredParams || [];
    this.allowedRoles = props.allowedRoles || [];
    this.requiresConfirmation = props.requiresConfirmation || false;
    
    // Campos de execução
    this.status = ACTION_STATUS.PENDING;
    this.executedAt = null;
    this.executedBy = null;
    this.result = null;
    this.commandId = null;
    this.params = {};
    
    this.validate();
  }
  
  /**
   * Valida a integridade do objeto de ação
   * @throws {DomainError} Se a validação falhar
   */
  validate() {
    if (!this.name) {
      throw new DomainError(
        'Nome da ação é obrigatório',
        'INVALID_ACTION_NAME'
      );
    }
    
    if (!Object.values(DEPARTMENTS).includes(this.department)) {
      throw new DomainError(
        `Departamento inválido. Deve ser um dos seguintes: ${Object.values(DEPARTMENTS).join(', ')}`,
        'INVALID_ACTION_DEPARTMENT'
      );
    }
    
    if (!Object.values(CRITICALITY_LEVELS).includes(this.criticality)) {
      throw new DomainError(
        `Nível de criticidade inválido. Deve ser um dos seguintes: ${Object.values(CRITICALITY_LEVELS).join(', ')}`,
        'INVALID_ACTION_CRITICALITY'
      );
    }
    
    if (typeof this.handler !== 'function') {
      throw new DomainError(
        'Handler deve ser uma função',
        'INVALID_ACTION_HANDLER'
      );
    }
  }
  
  /**
   * Define os parâmetros para execução da ação
   * @param {Object} params Parâmetros para execução
   * @returns {Action} this para encadeamento
   * @throws {DomainError} Se faltar algum parâmetro obrigatório
   */
  setParams(params) {
    // Verificar parâmetros obrigatórios
    for (const requiredParam of this.requiredParams) {
      if (params[requiredParam] === undefined) {
        throw new DomainError(
          `Parâmetro obrigatório "${requiredParam}" ausente`,
          'MISSING_REQUIRED_PARAM',
          { param: requiredParam }
        );
      }
    }
    
    this.params = { ...params };
    return this;
  }
  
  /**
   * Associa a ação a um comando
   * @param {string} commandId ID do comando que originou a ação
   * @returns {Action} this para encadeamento
   */
  setCommand(commandId) {
    this.commandId = commandId;
    return this;
  }
  
  /**
   * Executa a ação com os parâmetros fornecidos
   * @param {string} userId ID do usuário executando a ação
   * @param {Object} additionalParams Parâmetros adicionais (opcionais)
   * @returns {Promise<any>} Resultado da execução
   */
  async execute(userId, additionalParams = {}) {
    try {
      if (this.status !== ACTION_STATUS.PENDING && this.status !== ACTION_STATUS.AUTHORIZED) {
        throw new DomainError(
          `Não é possível executar ação no estado atual: ${this.status}`,
          'INVALID_ACTION_STATE'
        );
      }
      
      // Combinar parâmetros
      const executionParams = { ...this.params, ...additionalParams };
      
      // Registrar dados de execução
      this.status = ACTION_STATUS.IN_PROGRESS;
      this.executedBy = userId;
      this.executedAt = new Date();
      
      // Executar handler da ação
      const result = await this.handler(executionParams, userId);
      
      // Registrar resultado
      this.result = result;
      this.status = ACTION_STATUS.COMPLETED;
      
      return result;
    } catch (error) {
      // Registrar falha
      this.status = ACTION_STATUS.FAILED;
      this.result = {
        error: error.message,
        stack: error.stack
      };
      
      throw error;
    }
  }
  
  /**
   * Marca a ação como autorizada
   * @param {string} authorizedBy ID do usuário que autorizou
   * @returns {Action} this para encadeamento
   */
  authorize(authorizedBy) {
    if (this.status !== ACTION_STATUS.ESCALATED && this.status !== ACTION_STATUS.PENDING) {
      throw new DomainError(
        `Não é possível autorizar ação no estado atual: ${this.status}`,
        'INVALID_ACTION_STATE'
      );
    }
    
    this.status = ACTION_STATUS.AUTHORIZED;
    this.metadata = {
      ...this.metadata,
      authorizedBy,
      authorizedAt: new Date()
    };
    
    return this;
  }
  
  /**
   * Marca a ação como rejeitada
   * @param {string} rejectedBy ID do usuário que rejeitou
   * @param {string} reason Motivo da rejeição
   * @returns {Action} this para encadeamento
   */
  reject(rejectedBy, reason) {
    if (this.status !== ACTION_STATUS.ESCALATED && this.status !== ACTION_STATUS.PENDING) {
      throw new DomainError(
        `Não é possível rejeitar ação no estado atual: ${this.status}`,
        'INVALID_ACTION_STATE'
      );
    }
    
    this.status = ACTION_STATUS.REJECTED;
    this.metadata = {
      ...this.metadata,
      rejectedBy,
      rejectedAt: new Date(),
      reason
    };
    
    return this;
  }
  
  /**
   * Marca a ação como escalonada
   * @param {string} escalationId ID do escalamento criado
   * @returns {Action} this para encadeamento
   */
  escalate(escalationId) {
    if (this.status !== ACTION_STATUS.PENDING) {
      throw new DomainError(
        `Não é possível escalonar ação no estado atual: ${this.status}`,
        'INVALID_ACTION_STATE'
      );
    }
    
    this.status = ACTION_STATUS.ESCALATED;
    this.metadata = {
      ...this.metadata,
      escalationId,
      escalatedAt: new Date()
    };
    
    return this;
  }
  
  /**
   * Transforma a ação em um objeto simples para serialização
   * @returns {Object} Representação simples da ação
   */
  toJSON() {
    // Não incluir o handler na serialização
    const { handler, ...actionData } = this;
    return actionData;
  }
  
  /**
   * Cria uma instância de Action a partir de um objeto simples e um mapa de handlers
   * @param {Object} data Dados da ação
   * @param {Object<string, Function>} handlersMap Mapa de handlers disponíveis
   * @returns {Action} Nova instância
   */
  static fromJSON(data, handlersMap) {
    if (!handlersMap[data.name]) {
      throw new DomainError(
        `Handler não encontrado para a ação "${data.name}"`,
        'HANDLER_NOT_FOUND'
      );
    }
    
    const action = new Action({
      ...data,
      handler: handlersMap[data.name]
    });
    
    // Restaurar estado de execução
    action.status = data.status || ACTION_STATUS.PENDING;
    action.executedAt = data.executedAt ? new Date(data.executedAt) : null;
    action.executedBy = data.executedBy;
    action.result = data.result;
    action.commandId = data.commandId;
    action.params = data.params || {};
    
    return action;
  }
}

// Exportar classe, constantes e utilitários
module.exports = {
  Action,
  CRITICALITY_LEVELS,
  DEPARTMENTS,
  ACTION_STATUS
};
