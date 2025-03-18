/**
 * Factory para criação de objetos Command
 * Responsável por construir comandos e validar dados de entrada
 */
const { v4: uuidv4 } = require('uuid');
const Command = require('../entities/Command');
const { DomainError } = require('../../core/exceptions');

class CommandFactory {
  /**
   * Cria um novo comando a partir dos dados de requisição
   * @param {Object} data Dados para criação do comando
   * @param {string} data.query Texto da consulta
   * @param {string} data.userId ID do usuário
   * @param {string} data.sessionId ID da sessão
   * @param {string} data.source Fonte do comando (text, voice, etc)
   * @param {Object} data.metadata Metadados adicionais
   * @returns {Command} Comando criado
   */
  static createFromRequest(data) {
    this._validateCommandData(data);
    
    return new Command({
      id: uuidv4(),
      query: data.query.trim(),
      userId: data.userId,
      sessionId: data.sessionId,
      source: data.source || 'text',
      metadata: data.metadata || {},
      createdAt: new Date(),
      status: 'pending'
    });
  }

  /**
   * Cria um comando a partir dos dados do banco de dados
   * @param {Object} data Dados do banco de dados
   * @returns {Command} Comando criado
   */
  static createFromDatabase(data) {
    // Garantir que todos os campos necessários estão presentes
    this._validateRequiredFields(data, ['id', 'query', 'userId', 'sessionId', 'status']);
    
    return new Command({
      id: data.id,
      query: data.query,
      userId: data.userId,
      sessionId: data.sessionId,
      source: data.source || 'text',
      status: data.status,
      intent: data.intent,
      intentConfidence: data.intentConfidence,
      entities: data.entities || [],
      escalationId: data.escalationId,
      escalationApprovers: data.escalationApprovers,
      result: data.result,
      processingTime: data.processingTime,
      error: data.error,
      metadata: data.metadata || {},
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    });
  }

  /**
   * Cria um batch de comandos a partir dos dados do banco de dados
   * @param {Array<Object>} dataArray Array de dados do banco de dados
   * @returns {Array<Command>} Comandos criados
   */
  static createBatchFromDatabase(dataArray) {
    if (!Array.isArray(dataArray)) {
      throw new DomainError('Dados inválidos para criação em lote', 'INVALID_BATCH_DATA');
    }
    
    return dataArray.map(data => this.createFromDatabase(data));
  }

  /**
   * Valida os dados para criação de comando
   * @private
   * @param {Object} data Dados a serem validados
   */
  static _validateCommandData(data) {
    // Verificar campos obrigatórios
    this._validateRequiredFields(data, ['query', 'userId', 'sessionId']);
    
    // Validar comprimento da consulta
    if (data.query.trim().length < 2) {
      throw new DomainError('A consulta deve ter pelo menos 2 caracteres', 'INVALID_QUERY_LENGTH');
    }
    
    // Validar que o ID de usuário é uma string não vazia
    if (typeof data.userId !== 'string' || data.userId.trim().length === 0) {
      throw new DomainError('ID de usuário inválido', 'INVALID_USER_ID');
    }
    
    // Validar que o ID de sessão é uma string não vazia
    if (typeof data.sessionId !== 'string' || data.sessionId.trim().length === 0) {
      throw new DomainError('ID de sessão inválido', 'INVALID_SESSION_ID');
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

module.exports = CommandFactory;
