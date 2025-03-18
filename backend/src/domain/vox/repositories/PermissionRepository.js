/**
 * Interface de repositório para Permission
 * Define o contrato que as implementações concretas devem seguir
 */
class PermissionRepository {
  /**
   * Registra uma nova permissão no repositório
   * @param {Permission} permission Permissão a ser registrada
   * @returns {Promise<Permission>} Permissão registrada
   */
  async register(permission) {
    throw new Error('Method not implemented');
  }

  /**
   * Atualiza uma permissão existente
   * @param {Permission} permission Permissão a ser atualizada
   * @returns {Promise<Permission>} Permissão atualizada
   */
  async update(permission) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca permissões para uma ação específica
   * @param {string} actionName Nome da ação
   * @param {string} department Departamento (opcional)
   * @returns {Promise<Array<Permission>>} Lista de permissões aplicáveis
   */
  async findForAction(actionName, department) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca permissões por padrão
   * @param {string} pattern Padrão de nome de ação
   * @returns {Promise<Array<Permission>>} Lista de permissões
   */
  async findByPattern(pattern) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca permissões por departamento
   * @param {string} department Departamento
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Permission>>} Lista de permissões
   */
  async findByDepartment(department, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca permissões por nível de criticidade
   * @param {string} criticality Nível de criticidade
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Permission>>} Lista de permissões
   */
  async findByCriticality(criticality, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca permissões por nível de permissão
   * @param {string} permissionLevel Nível de permissão
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Permission>>} Lista de permissões
   */
  async findByPermissionLevel(permissionLevel, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca permissões por restrição de papel
   * @param {string} role Papel/função
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Permission>>} Lista de permissões
   */
  async findByRoleRestriction(role, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Lista todas as permissões
   * @param {Object} options Opções de paginação
   * @returns {Promise<Array<Permission>>} Lista de permissões
   */
  async listAll(options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove uma permissão
   * @param {string} actionPattern Padrão da ação
   * @param {string} department Departamento (opcional)
   * @returns {Promise<boolean>} true se removida com sucesso
   */
  async remove(actionPattern, department) {
    throw new Error('Method not implemented');
  }
}

module.exports = PermissionRepository;
