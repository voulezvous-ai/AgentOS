/**
 * Interface de repositório para Command
 * Define o contrato que as implementações concretas devem seguir
 */
class CommandRepository {
  /**
   * Cria um novo comando no repositório
   * @param {Command} command Comando a ser salvo
   * @returns {Promise<Command>} Comando salvo com ID gerado
   */
  async create(command) {
    throw new Error('Method not implemented');
  }

  /**
   * Atualiza um comando existente
   * @param {Command} command Comando a ser atualizado
   * @returns {Promise<Command>} Comando atualizado
   */
  async update(command) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca um comando pelo ID
   * @param {string} id ID do comando
   * @returns {Promise<Command|null>} Comando encontrado ou null
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca comandos por ID de sessão
   * @param {string} sessionId ID da sessão
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Command>>} Lista de comandos
   */
  async findBySessionId(sessionId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca comandos por ID de usuário
   * @param {string} userId ID do usuário
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Command>>} Lista de comandos
   */
  async findByUserId(userId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca comandos por tipo e status
   * @param {string} type Tipo do comando
   * @param {string} status Status do comando
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Command>>} Lista de comandos
   */
  async findByTypeAndStatus(type, status, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca comandos por intervalo de tempo
   * @param {Date} startDate Data inicial
   * @param {Date} endDate Data final
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Command>>} Lista de comandos
   */
  async findByTimeRange(startDate, endDate, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove um comando pelo ID
   * @param {string} id ID do comando
   * @returns {Promise<boolean>} true se removido com sucesso
   */
  async remove(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = CommandRepository;
