/**
 * Modelo de domínio Permission
 * Representa as permissões para ações do Vox
 */
const { DomainError } = require('../../core/exceptions');

// Constantes para níveis de permissão
const PERMISSION_LEVELS = {
  ALWAYS_ALLOWED: 'always_allowed',
  ALLOWED: 'allowed',
  NEEDS_CONFIRMATION: 'needs_confirmation',
  NEEDS_APPROVAL: 'needs_approval',
  FORBIDDEN: 'forbidden'
};

class Permission {
  /**
   * @param {Object} props Propriedades da permissão
   * @param {string} props.actionName Nome da ação
   * @param {string} props.actionDepartment Departamento da ação
   * @param {string} props.actionCriticality Criticidade da ação
   * @param {string} props.permissionLevel Nível de permissão
   * @param {Array<string>} props.approvers Papéis/usuários que podem aprovar (se necessário)
   * @param {Array<string>} props.roleRestrictions Papéis que podem executar a ação
   * @param {Object} props.contextRestrictions Restrições de contexto para a permissão
   * @param {Date} props.validUntil Data até a qual a permissão é válida
   */
  constructor(props) {
    this.actionName = props.actionName;
    this.actionPattern = props.actionPattern || props.actionName; // Permite padrões como "inventory.*"
    this.actionDepartment = props.actionDepartment;
    this.actionCriticality = props.actionCriticality;
    this.permissionLevel = props.permissionLevel || PERMISSION_LEVELS.NEEDS_APPROVAL;
    this.approvers = props.approvers || [];
    this.roleRestrictions = props.roleRestrictions || [];
    this.contextRestrictions = props.contextRestrictions || {};
    this.validUntil = props.validUntil;
    this.createdAt = props.createdAt || new Date();
    
    this.validate();
  }
  
  /**
   * Valida a integridade do objeto de permissão
   * @throws {DomainError} Se a validação falhar
   */
  validate() {
    if (!this.actionPattern) {
      throw new DomainError(
        'Nome ou padrão da ação é obrigatório',
        'INVALID_PERMISSION_ACTION'
      );
    }
    
    if (!Object.values(PERMISSION_LEVELS).includes(this.permissionLevel)) {
      throw new DomainError(
        `Nível de permissão inválido. Deve ser um dos seguintes: ${Object.values(PERMISSION_LEVELS).join(', ')}`,
        'INVALID_PERMISSION_LEVEL'
      );
    }
    
    if (this.permissionLevel === PERMISSION_LEVELS.NEEDS_APPROVAL && this.approvers.length === 0) {
      throw new DomainError(
        'Aprovadores são obrigatórios para permissões que necessitam aprovação',
        'INVALID_PERMISSION_APPROVERS'
      );
    }
    
    if (this.validUntil && !(this.validUntil instanceof Date)) {
      throw new DomainError(
        'Data de validade inválida',
        'INVALID_PERMISSION_VALIDITY'
      );
    }
  }
  
  /**
   * Verifica se a permissão está expirada
   * @returns {boolean} Verdadeiro se expirada
   */
  isExpired() {
    return this.validUntil && this.validUntil < new Date();
  }
  
  /**
   * Verifica se a permissão se aplica a uma ação específica
   * @param {string} actionName Nome da ação
   * @param {string} department Departamento da ação
   * @returns {boolean} Verdadeiro se a permissão se aplica
   */
  appliesToAction(actionName, department) {
    // Verificar expiração
    if (this.isExpired()) {
      return false;
    }
    
    // Verificar correspondência de departamento (se especificado)
    if (this.actionDepartment && this.actionDepartment !== department) {
      return false;
    }
    
    // Verificar correspondência de nome/padrão
    if (this.actionPattern === '*') {
      return true; // Permissão global
    }
    
    if (this.actionPattern.endsWith('.*')) {
      // Padrão de prefixo (ex: "inventory.*")
      const prefix = this.actionPattern.slice(0, -2);
      return actionName === prefix || actionName.startsWith(prefix + '.');
    }
    
    // Correspondência exata
    return this.actionPattern === actionName;
  }
  
  /**
   * Verifica se um usuário tem permissão para executar uma ação
   * @param {Object} user Usuário tentando executar a ação
   * @param {Object} context Contexto da execução
   * @returns {Object} Resultado com permissionLevel e motivo
   */
  checkUserPermission(user, context = {}) {
    // Verificar expiração
    if (this.isExpired()) {
      return {
        permitted: false,
        permissionLevel: PERMISSION_LEVELS.FORBIDDEN,
        reason: 'Permissão expirada'
      };
    }
    
    // Verificar restrições de papel
    if (this.roleRestrictions.length > 0) {
      const userRoles = user.roles || [];
      const hasRequiredRole = this.roleRestrictions.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return {
          permitted: false,
          permissionLevel: PERMISSION_LEVELS.FORBIDDEN,
          reason: 'Usuário não possui os papéis necessários'
        };
      }
    }
    
    // Verificar restrições de contexto
    for (const [key, value] of Object.entries(this.contextRestrictions)) {
      if (context[key] !== value) {
        return {
          permitted: false,
          permissionLevel: PERMISSION_LEVELS.FORBIDDEN,
          reason: `Contexto inválido: ${key}`
        };
      }
    }
    
    // Determinar resultado baseado no nível de permissão
    const result = {
      permissionLevel: this.permissionLevel
    };
    
    switch (this.permissionLevel) {
      case PERMISSION_LEVELS.ALWAYS_ALLOWED:
      case PERMISSION_LEVELS.ALLOWED:
        result.permitted = true;
        break;
      case PERMISSION_LEVELS.NEEDS_CONFIRMATION:
        result.permitted = false;
        result.requiresConfirmation = true;
        result.reason = 'Requer confirmação do usuário';
        break;
      case PERMISSION_LEVELS.NEEDS_APPROVAL:
        result.permitted = false;
        result.requiresApproval = true;
        result.approvers = this.approvers;
        result.reason = 'Requer aprovação';
        break;
      case PERMISSION_LEVELS.FORBIDDEN:
        result.permitted = false;
        result.reason = 'Ação proibida';
        break;
    }
    
    return result;
  }
  
  /**
   * Transforma a permissão em um objeto simples para serialização
   * @returns {Object} Representação simples da permissão
   */
  toJSON() {
    return {
      actionName: this.actionName,
      actionPattern: this.actionPattern,
      actionDepartment: this.actionDepartment,
      actionCriticality: this.actionCriticality,
      permissionLevel: this.permissionLevel,
      approvers: this.approvers,
      roleRestrictions: this.roleRestrictions,
      contextRestrictions: this.contextRestrictions,
      validUntil: this.validUntil,
      createdAt: this.createdAt
    };
  }
  
  /**
   * Cria uma instância de Permission a partir de um objeto simples
   * @param {Object} data Dados da permissão
   * @returns {Permission} Nova instância
   */
  static fromJSON(data) {
    return new Permission({
      ...data,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
    });
  }
}

// Exportar classe e constantes
module.exports = {
  Permission,
  PERMISSION_LEVELS
};
