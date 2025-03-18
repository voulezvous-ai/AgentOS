/**
 * Modelo de domínio Command
 * Representa um comando recebido para processamento pelo Vox
 */
const { v4: uuidv4 } = require('uuid');
const { DomainError } = require('../../core/exceptions');

class Command {
  /**
   * @param {Object} props Propriedades do comando
   * @param {string} props.id Identificador único do comando
   * @param {string} props.query Texto do comando/consulta
   * @param {string} props.userId Identificador do usuário que emitiu o comando
   * @param {string} props.type Tipo do comando ('text', 'voice')
   * @param {string} props.sessionId Identificador da sessão
   * @param {Date} props.timestamp Momento em que o comando foi criado
   * @param {string} props.source Origem do comando ('api', 'web', 'mobile', etc)
   * @param {Object} props.metadata Metadados adicionais do comando
   */
  constructor(props) {
    this.id = props.id || uuidv4();
    this.query = props.query;
    this.userId = props.userId;
    this.type = props.type || 'text';
    this.sessionId = props.sessionId || uuidv4();
    this.timestamp = props.timestamp || new Date();
    this.source = props.source || 'api';
    this.metadata = props.metadata || {};
    
    this.intent = null;
    this.entities = [];
    this.result = null;
    this.processingTime = null;
    this.status = 'pending';
    
    this.validate();
  }
  
  /**
   * Valida a integridade do objeto de comando
   * @throws {DomainError} Se a validação falhar
   */
  validate() {
    if (!this.query || typeof this.query !== 'string') {
      throw new DomainError(
        'Consulta é obrigatória e deve ser uma string',
        'INVALID_COMMAND_QUERY'
      );
    }
    
    if (!this.userId) {
      throw new DomainError(
        'ID do usuário é obrigatório',
        'INVALID_COMMAND_USER'
      );
    }
    
    if (!['text', 'voice'].includes(this.type)) {
      throw new DomainError(
        'Tipo de comando inválido. Deve ser "text" ou "voice"',
        'INVALID_COMMAND_TYPE'
      );
    }
  }
  
  /**
   * Define a intenção identificada no comando
   * @param {string} intent Nome da intenção identificada
   * @param {number} confidence Nível de confiança da classificação
   * @param {Array} entities Entidades extraídas do comando
   */
  setIntent(intent, confidence = 1.0, entities = []) {
    this.intent = {
      name: intent,
      confidence,
      timestamp: new Date()
    };
    
    this.entities = entities;
    return this;
  }
  
  /**
   * Marca o comando como processado com um resultado
   * @param {Object} result Resultado do processamento
   * @param {number} processingTime Tempo de processamento em ms
   */
  setResult(result, processingTime) {
    this.result = result;
    this.processingTime = processingTime;
    this.status = 'completed';
    return this;
  }
  
  /**
   * Marca o comando como tendo falhado
   * @param {string} reason Motivo da falha
   * @param {Object} error Detalhes do erro
   */
  setFailed(reason, error = null) {
    this.status = 'failed';
    this.result = { reason, error };
    return this;
  }
  
  /**
   * Marca o comando como sendo escalonado
   * @param {string} escalationId ID do escalamento criado
   * @param {string} escalatedTo Para quem foi escalonado
   */
  setEscalated(escalationId, escalatedTo) {
    this.status = 'escalated';
    this.result = { 
      escalationId, 
      escalatedTo, 
      timestamp: new Date() 
    };
    return this;
  }
  
  /**
   * Transforma o comando em um objeto simples para serialização
   * @returns {Object} Representação simples do comando
   */
  toJSON() {
    return {
      id: this.id,
      query: this.query,
      userId: this.userId,
      type: this.type,
      sessionId: this.sessionId,
      timestamp: this.timestamp,
      source: this.source,
      intent: this.intent,
      entities: this.entities,
      result: this.result,
      processingTime: this.processingTime,
      status: this.status,
      metadata: this.metadata
    };
  }
  
  /**
   * Cria uma instância de Command a partir de um objeto simples
   * @param {Object} data Dados do comando
   * @returns {Command} Nova instância
   */
  static fromJSON(data) {
    const command = new Command({
      id: data.id,
      query: data.query,
      userId: data.userId,
      type: data.type,
      sessionId: data.sessionId,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      source: data.source,
      metadata: data.metadata
    });
    
    command.intent = data.intent;
    command.entities = data.entities || [];
    command.result = data.result;
    command.processingTime = data.processingTime;
    command.status = data.status || 'pending';
    
    return command;
  }
}

module.exports = Command;
