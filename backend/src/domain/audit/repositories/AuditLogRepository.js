/**
 * Interface de repositório para AuditLog
 * Define o contrato que as implementações concretas devem seguir
 */
class AuditLogRepository {
  /**
   * Registra um novo log de auditoria
   * @param {AuditLog} auditLog Log de auditoria a ser registrado
   * @returns {Promise<AuditLog>} Log de auditoria registrado
   */
  async record(auditLog) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca um log de auditoria pelo ID
   * @param {string} id ID do log
   * @returns {Promise<AuditLog|null>} Log encontrado ou null
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca logs por tipo de evento
   * @param {string} eventType Tipo de evento
   * @param {Object} options Opções de paginação e filtragem
   * @returns {Promise<Array<AuditLog>>} Lista de logs
   */
  async findByEventType(eventType, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca logs por ID de usuário
   * @param {string} userId ID do usuário
   * @param {Object} options Opções de paginação e filtragem
   * @returns {Promise<Array<AuditLog>>} Lista de logs
   */
  async findByUserId(userId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca logs por ID de recurso
   * @param {string} resourceId ID do recurso
   * @param {string} resourceType Tipo do recurso (opcional)
   * @param {Object} options Opções de paginação e filtragem
   * @returns {Promise<Array<AuditLog>>} Lista de logs
   */
  async findByResourceId(resourceId, resourceType, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca logs por ID de sessão
   * @param {string} sessionId ID da sessão
   * @param {Object} options Opções de paginação e filtragem
   * @returns {Promise<Array<AuditLog>>} Lista de logs
   */
  async findBySessionId(sessionId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca logs por intervalo de tempo
   * @param {Date} startDate Data inicial
   * @param {Date} endDate Data final
   * @param {Object} options Opções de paginação e filtragem
   * @returns {Promise<Array<AuditLog>>} Lista de logs
   */
  async findByTimeRange(startDate, endDate, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca logs por nível de severidade
   * @param {string|Array<string>} severity Nível ou níveis de severidade
   * @param {Object} options Opções de paginação e filtragem
   * @returns {Promise<Array<AuditLog>>} Lista de logs
   */
  async findBySeverity(severity, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca logs por resultado
   * @param {string} outcome Resultado ('success', 'failure', etc)
   * @param {Object} options Opções de paginação e filtragem
   * @returns {Promise<Array<AuditLog>>} Lista de logs
   */
  async findByOutcome(outcome, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Realiza uma busca avançada com múltiplos critérios
   * @param {Object} criteria Critérios de busca
   * @param {Object} options Opções de paginação e filtragem
   * @returns {Promise<Array<AuditLog>>} Lista de logs
   */
  async search(criteria, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Obtém estatísticas de auditoria
   * @param {string} groupBy Campo para agrupar estatísticas
   * @param {Object} filters Filtros a aplicar
   * @param {Object} options Opções adicionais
   * @returns {Promise<Object>} Estatísticas
   */
  async getStatistics(groupBy, filters = {}, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove logs de auditoria antigos
   * @param {Date} before Data limite
   * @param {Object} filters Filtros adicionais
   * @returns {Promise<number>} Número de logs removidos
   */
  async pruneOldLogs(before, filters = {}) {
    throw new Error('Method not implemented');
  }
}

module.exports = AuditLogRepository;
