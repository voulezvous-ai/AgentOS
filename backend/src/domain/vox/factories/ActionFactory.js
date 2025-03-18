/**
 * Factory para criação de objetos Action
 * Responsável por construir ações e validar dados de entrada
 */
const { v4: uuidv4 } = require('uuid');
const { Action, CRITICALITY_LEVELS } = require('../entities/Action');
const { DomainError } = require('../../core/exceptions');

class ActionFactory {
  /**
   * Cria uma nova ação a partir dos dados fornecidos
   * @param {Object} data Dados para criação da ação
   * @param {string} data.name Nome da ação
   * @param {string} data.description Descrição da ação
   * @param {string} data.department Departamento associado
   * @param {string} data.criticality Nível de criticidade
   * @param {Array<string>} data.requiredParams Parâmetros obrigatórios
   * @param {Array<string>} data.optionalParams Parâmetros opcionais
   * @param {Object} data.params Parâmetros da ação
   * @param {Function} data.executeFunction Função para execução (opcional)
   * @returns {Action} Ação criada
   */
  static create(data) {
    this._validateActionData(data);
    
    return new Action({
      id: data.id || uuidv4(),
      name: data.name,
      description: data.description,
      department: data.department,
      criticality: data.criticality,
      requiredParams: data.requiredParams || [],
      optionalParams: data.optionalParams || [],
      params: data.params || {},
      status: 'pending',
      executeFunction: data.executeFunction,
      createdAt: new Date()
    });
  }

  /**
   * Cria uma ação a partir do nome e parâmetros
   * @param {string} actionName Nome da ação
   * @param {Object} params Parâmetros da ação
   * @param {string} department Departamento (opcional)
   * @returns {Promise<Action>} Ação criada
   */
  static async createFromNameAndParams(actionName, params, department = null) {
    // Esta implementação presumiria que temos um repositório ou serviço
    // para obter a definição da ação a partir do nome
    throw new Error('Este método requer uma implementação específica do projeto');
  }

  /**
   * Cria uma ação a partir dos dados do banco de dados
   * @param {Object} data Dados do banco de dados
   * @returns {Action} Ação criada
   */
  static createFromDatabase(data) {
    // Validar campos obrigatórios
    this._validateRequiredFields(data, ['id', 'name', 'department', 'criticality', 'status']);
    
    return new Action({
      id: data.id,
      name: data.name,
      description: data.description,
      department: data.department,
      criticality: data.criticality,
      requiredParams: data.requiredParams || [],
      optionalParams: data.optionalParams || [],
      params: data.params || {},
      commandId: data.commandId,
      status: data.status,
      result: data.result,
      error: data.error,
      escalationId: data.escalationId,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      executeFunction: null // Não persistimos funções no banco
    });
  }

  /**
   * Cria um batch de ações a partir dos dados do banco de dados
   * @param {Array<Object>} dataArray Array de dados do banco de dados
   * @returns {Array<Action>} Ações criadas
   */
  static createBatchFromDatabase(dataArray) {
    if (!Array.isArray(dataArray)) {
      throw new DomainError('Dados inválidos para criação em lote', 'INVALID_BATCH_DATA');
    }
    
    return dataArray.map(data => this.createFromDatabase(data));
  }

  /**
   * Registra uma nova definição de ação no sistema
   * @param {Object} definition Definição da ação
   * @returns {Action} Ação definida
   */
  static registerActionDefinition(definition) {
    // Esta implementação pressupõe que temos um repositório de definições de ações
    throw new Error('Este método requer uma implementação específica do projeto');
  }

  /**
   * Valida os dados para criação de ação
   * @private
   * @param {Object} data Dados a serem validados
   */
  static _validateActionData(data) {
    // Verificar campos obrigatórios
    this._validateRequiredFields(data, ['name', 'department', 'criticality']);
    
    // Validar nome da ação
    if (typeof data.name !== 'string' || data.name.trim().length < 2) {
      throw new DomainError('Nome de ação inválido', 'INVALID_ACTION_NAME');
    }
    
    // Validar departamento
    if (typeof data.department !== 'string' || data.department.trim().length === 0) {
      throw new DomainError('Departamento inválido', 'INVALID_DEPARTMENT');
    }
    
    // Validar criticidade
    if (!Object.values(CRITICALITY_LEVELS).includes(data.criticality)) {
      throw new DomainError(
        `Criticidade inválida: ${data.criticality}. Deve ser uma de ${Object.values(CRITICALITY_LEVELS).join(', ')}`,
        'INVALID_CRITICALITY'
      );
    }
    
    // Validar parâmetros se fornecidos
    if (data.params) {
      if (typeof data.params !== 'object') {
        throw new DomainError('Parâmetros devem ser um objeto', 'INVALID_PARAMS_TYPE');
      }
      
      // Validar parâmetros obrigatórios
      if (data.requiredParams && Array.isArray(data.requiredParams)) {
        for (const param of data.requiredParams) {
          if (data.params[param] === undefined) {
            throw new DomainError(`Parâmetro obrigatório não fornecido: ${param}`, 'MISSING_REQUIRED_PARAM');
          }
        }
      }
    }
  }

  /**
   * Valida campos obrigatórios
   * @private
   * @param {Object} data Dados a serem validados
   * @param {Array<string>} requiredFields Campos obrigatórios
   */
  static _validateRequiredFields(data, requiredFields) {
    if (!data) {
      throw new DomainError('Dados não fornecidos', 'MISSING_DATA');
    }
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new DomainError(`Campo obrigatório não fornecido: ${field}`, 'MISSING_REQUIRED_FIELD');
      }
    }
  }
}

module.exports = ActionFactory;
