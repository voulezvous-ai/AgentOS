/**
 * Interface de repositório para Action
 * Define o contrato que as implementações concretas devem seguir
 */
class ActionRepository {
  /**
   * Registra uma nova ação no repositório
   * @param {Action} action Ação a ser registrada
   * @returns {Promise<Action>} Ação registrada com ID gerado
   */
  async register(action) {
    throw new Error('Method not implemented');
  }

  /**
   * Atualiza uma ação existente
   * @param {Action} action Ação a ser atualizada
   * @returns {Promise<Action>} Ação atualizada
   */
  async update(action) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca uma ação pelo ID
   * @param {string} id ID da ação
   * @returns {Promise<Action|null>} Ação encontrada ou null
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca uma ação pelo nome
   * @param {string} name Nome da ação
   * @returns {Promise<Action|null>} Ação encontrada ou null
   */
  async findByName(name) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca ações por departamento
   * @param {string} department Departamento
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Action>>} Lista de ações
   */
  async findByDepartment(department, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca ações por criticidade
   * @param {string} criticality Nível de criticidade
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Action>>} Lista de ações
   */
  async findByCriticality(criticality, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca ações por estado
   * @param {string} status Estado da ação
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Action>>} Lista de ações
   */
  async findByStatus(status, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca ações por ID de comando
   * @param {string} commandId ID do comando
   * @returns {Promise<Array<Action>>} Lista de ações
   */
  async findByCommandId(commandId) {
    throw new Error('Method not implemented');
  }
  
  /**
   * Lista todas as ações registradas
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Action>>} Lista de ações
   */
  async listAll(options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove uma ação pelo ID
   * @param {string} id ID da ação
   * @returns {Promise<boolean>} true se removida com sucesso
   */
  async remove(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = ActionRepository;
