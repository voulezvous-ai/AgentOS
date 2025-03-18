/**
 * Interface de repositório para Escalation
 * Define o contrato que as implementações concretas devem seguir
 */
class EscalationRepository {
  /**
   * Cria uma nova escalação no repositório
   * @param {Escalation} escalation Escalação a ser salva
   * @returns {Promise<Escalation>} Escalação salva com ID gerado
   */
  async create(escalation) {
    throw new Error('Method not implemented');
  }

  /**
   * Atualiza uma escalação existente
   * @param {Escalation} escalation Escalação a ser atualizada
   * @returns {Promise<Escalation>} Escalação atualizada
   */
  async update(escalation) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca uma escalação pelo ID
   * @param {string} id ID da escalação
   * @returns {Promise<Escalation|null>} Escalação encontrada ou null
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca escalações por ID de ação
   * @param {string} actionId ID da ação
   * @returns {Promise<Array<Escalation>>} Lista de escalações
   */
  async findByActionId(actionId) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca escalações por ID de usuário
   * @param {string} userId ID do usuário
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Escalation>>} Lista de escalações
   */
  async findByUserId(userId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca escalações por aprovador
   * @param {string} approverId ID do aprovador
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Escalation>>} Lista de escalações
   */
  async findByApprover(approverId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca escalações por estado
   * @param {string} status Estado da escalação
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Escalation>>} Lista de escalações
   */
  async findByStatus(status, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca escalações pendentes para um departamento
   * @param {string} department Departamento
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Escalation>>} Lista de escalações pendentes
   */
  async findPendingByDepartment(department, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca escalações próximas de expirar
   * @param {Date} before Data limite
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Escalation>>} Lista de escalações
   */
  async findExpiringBefore(before, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Marca escalações expiradas como expiradas
   * @param {Date} now Data atual
   * @returns {Promise<number>} Número de escalações atualizadas
   */
  async markExpired(now = new Date()) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove uma escalação pelo ID
   * @param {string} id ID da escalação
   * @returns {Promise<boolean>} true se removida com sucesso
   */
  async remove(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = EscalationRepository;
