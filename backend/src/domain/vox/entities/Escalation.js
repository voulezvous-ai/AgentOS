/**
 * Modelo de domínio Escalation
 * Representa uma escalação de ação que precisa de aprovação
 */
const { v4: uuidv4 } = require('uuid');
const { DomainError } = require('../../core/exceptions');

// Constantes para estados de escalação
const ESCALATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CANCELED: 'canceled'
};

// Constantes para prioridade de escalação
const ESCALATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

class Escalation {
  /**
   * @param {Object} props Propriedades da escalação
   * @param {string} props.id Identificador único da escalação
   * @param {string} props.actionId ID da ação escalada
   * @param {string} props.commandId ID do comando original
   * @param {string} props.userId ID do usuário que iniciou a ação
   * @param {string} props.description Descrição da escalação
   * @param {string} props.priority Prioridade da escalação
   * @param {Array<string>} props.approvers Usuários/papéis que podem aprovar
   * @param {string} props.department Departamento relacionado
   * @param {Object} props.actionDetails Detalhes da ação a ser executada
   * @param {Date} props.expiresAt Data de expiração da escalação
   * @param {string} props.notificationType Tipo de notificação ('email', 'sms', 'push')
   */
  constructor(props) {
    this.id = props.id || uuidv4();
    this.actionId = props.actionId;
    this.commandId = props.commandId;
    this.userId = props.userId;
    this.description = props.description || '';
    this.priority = props.priority || ESCALATION_PRIORITY.MEDIUM;
    this.approvers = props.approvers || [];
    this.department = props.department;
    this.actionDetails = props.actionDetails || {};
    this.createdAt = props.createdAt || new Date();
    this.expiresAt = props.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24h
    this.notificationType = props.notificationType || 'email';
    
    // Campos de status
    this.status = ESCALATION_STATUS.PENDING;
    this.approvedBy = null;
    this.approvedAt = null;
    this.rejectedBy = null;
    this.rejectedAt = null;
    this.rejectionReason = null;
    this.notificationsSent = [];
    
    this.validate();
  }
  
  /**
   * Valida a integridade do objeto de escalação
   * @throws {DomainError} Se a validação falhar
   */
  validate() {
    if (!this.actionId) {
      throw new DomainError(
        'ID da ação é obrigatório',
        'INVALID_ESCALATION_ACTION_ID'
      );
    }
    
    if (!this.userId) {
      throw new DomainError(
        'ID do usuário é obrigatório',
        'INVALID_ESCALATION_USER_ID'
      );
    }
    
    if (!Object.values(ESCALATION_PRIORITY).includes(this.priority)) {
      throw new DomainError(
        `Prioridade inválida. Deve ser um dos seguintes: ${Object.values(ESCALATION_PRIORITY).join(', ')}`,
        'INVALID_ESCALATION_PRIORITY'
      );
    }
    
    if (this.approvers.length === 0) {
      throw new DomainError(
        'Pelo menos um aprovador deve ser especificado',
        'INVALID_ESCALATION_APPROVERS'
      );
    }
    
    if (!(this.expiresAt instanceof Date) || isNaN(this.expiresAt.getTime())) {
      throw new DomainError(
        'Data de expiração inválida',
        'INVALID_ESCALATION_EXPIRATION'
      );
    }
  }
  
  /**
   * Verifica se a escalação está pendente
   * @returns {boolean} Verdadeiro se pendente
   */
  isPending() {
    return this.status === ESCALATION_STATUS.PENDING;
  }
  
  /**
   * Verifica se a escalação está expirada
   * @returns {boolean} Verdadeiro se expirada
   */
  isExpired() {
    return this.expiresAt <= new Date() && this.isPending();
  }
  
  /**
   * Aprova a escalação
   * @param {string} approverId ID do usuário que aprovou
   * @param {Object} additionalInfo Informações adicionais sobre a aprovação
   * @returns {Escalation} this para encadeamento
   * @throws {DomainError} Se a aprovação não for possível
   */
  approve(approverId, additionalInfo = {}) {
    if (!this.isPending()) {
      throw new DomainError(
        `Não é possível aprovar escalação no estado atual: ${this.status}`,
        'INVALID_ESCALATION_STATE'
      );
    }
    
    if (this.isExpired()) {
      this.status = ESCALATION_STATUS.EXPIRED;
      throw new DomainError(
        'Escalação expirada',
        'ESCALATION_EXPIRED'
      );
    }
    
    // Verificar se o usuário tem permissão para aprovar
    if (!this.approvers.includes(approverId) && !this.approvers.includes('*')) {
      throw new DomainError(
        'Usuário não tem permissão para aprovar esta escalação',
        'UNAUTHORIZED_APPROVAL',
        { approverId, allowedApprovers: this.approvers }
      );
    }
    
    this.status = ESCALATION_STATUS.APPROVED;
    this.approvedBy = approverId;
    this.approvedAt = new Date();
    this.approvalInfo = additionalInfo;
    
    return this;
  }
  
  /**
   * Rejeita a escalação
   * @param {string} rejecterId ID do usuário que rejeitou
   * @param {string} reason Motivo da rejeição
   * @returns {Escalation} this para encadeamento
   * @throws {DomainError} Se a rejeição não for possível
   */
  reject(rejecterId, reason) {
    if (!this.isPending()) {
      throw new DomainError(
        `Não é possível rejeitar escalação no estado atual: ${this.status}`,
        'INVALID_ESCALATION_STATE'
      );
    }
    
    if (this.isExpired()) {
      this.status = ESCALATION_STATUS.EXPIRED;
      throw new DomainError(
        'Escalação expirada',
        'ESCALATION_EXPIRED'
      );
    }
    
    // Verificar se o usuário tem permissão para rejeitar
    if (!this.approvers.includes(rejecterId) && !this.approvers.includes('*')) {
      throw new DomainError(
        'Usuário não tem permissão para rejeitar esta escalação',
        'UNAUTHORIZED_REJECTION',
        { rejecterId, allowedApprovers: this.approvers }
      );
    }
    
    this.status = ESCALATION_STATUS.REJECTED;
    this.rejectedBy = rejecterId;
    this.rejectedAt = new Date();
    this.rejectionReason = reason || 'Nenhum motivo fornecido';
    
    return this;
  }
  
  /**
   * Cancela a escalação
   * @param {string} userId ID do usuário cancelando a escalação
   * @param {string} reason Motivo do cancelamento
   * @returns {Escalation} this para encadeamento
   * @throws {DomainError} Se o cancelamento não for possível
   */
  cancel(userId, reason) {
    if (!this.isPending()) {
      throw new DomainError(
        `Não é possível cancelar escalação no estado atual: ${this.status}`,
        'INVALID_ESCALATION_STATE'
      );
    }
    
    // Apenas o criador ou um aprovador pode cancelar
    if (userId !== this.userId && !this.approvers.includes(userId) && !this.approvers.includes('*')) {
      throw new DomainError(
        'Usuário não tem permissão para cancelar esta escalação',
        'UNAUTHORIZED_CANCELLATION'
      );
    }
    
    this.status = ESCALATION_STATUS.CANCELED;
    this.canceledBy = userId;
    this.canceledAt = new Date();
    this.cancellationReason = reason || 'Nenhum motivo fornecido';
    
    return this;
  }
  
  /**
   * Registra uma notificação enviada
   * @param {string} method Método de notificação ('email', 'sms', etc)
   * @param {string} recipient Destinatário da notificação
   * @param {boolean} success Se a notificação foi enviada com sucesso
   * @param {string} messageId ID da mensagem enviada
   * @returns {Escalation} this para encadeamento
   */
  recordNotification(method, recipient, success, messageId = null) {
    this.notificationsSent.push({
      timestamp: new Date(),
      method,
      recipient,
      success,
      messageId,
    });
    
    return this;
  }
  
  /**
   * Verifica se a escalação deve expirar e atualiza seu estado
   * @returns {boolean} Verdadeiro se o estado foi alterado para expirado
   */
  checkExpiration() {
    if (this.isPending() && this.isExpired()) {
      this.status = ESCALATION_STATUS.EXPIRED;
      return true;
    }
    
    return false;
  }
  
  /**
   * Transforma a escalação em um objeto simples para serialização
   * @returns {Object} Representação simples da escalação
   */
  toJSON() {
    return {
      id: this.id,
      actionId: this.actionId,
      commandId: this.commandId,
      userId: this.userId,
      description: this.description,
      priority: this.priority,
      approvers: this.approvers,
      department: this.department,
      actionDetails: this.actionDetails,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      notificationType: this.notificationType,
      status: this.status,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      approvalInfo: this.approvalInfo,
      rejectedBy: this.rejectedBy,
      rejectedAt: this.rejectedAt,
      rejectionReason: this.rejectionReason,
      canceledBy: this.canceledBy,
      canceledAt: this.canceledAt,
      cancellationReason: this.cancellationReason,
      notificationsSent: this.notificationsSent
    };
  }
  
  /**
   * Cria uma instância de Escalation a partir de um objeto simples
   * @param {Object} data Dados da escalação
   * @returns {Escalation} Nova instância
   */
  static fromJSON(data) {
    const escalation = new Escalation({
      id: data.id,
      actionId: data.actionId,
      commandId: data.commandId,
      userId: data.userId,
      description: data.description,
      priority: data.priority,
      approvers: data.approvers,
      department: data.department,
      actionDetails: data.actionDetails,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      notificationType: data.notificationType
    });
    
    escalation.status = data.status || ESCALATION_STATUS.PENDING;
    escalation.approvedBy = data.approvedBy;
    escalation.approvedAt = data.approvedAt ? new Date(data.approvedAt) : null;
    escalation.approvalInfo = data.approvalInfo;
    escalation.rejectedBy = data.rejectedBy;
    escalation.rejectedAt = data.rejectedAt ? new Date(data.rejectedAt) : null;
    escalation.rejectionReason = data.rejectionReason;
    escalation.canceledBy = data.canceledBy;
    escalation.canceledAt = data.canceledAt ? new Date(data.canceledAt) : null;
    escalation.cancellationReason = data.cancellationReason;
    escalation.notificationsSent = data.notificationsSent || [];
    
    return escalation;
  }
}

// Exportar classe e constantes
module.exports = {
  Escalation,
  ESCALATION_STATUS,
  ESCALATION_PRIORITY
};
