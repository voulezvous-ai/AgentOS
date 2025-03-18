/**
 * DTOs para Escalation
 * Objetos de transferência de dados para comunicação entre camadas
 */

/**
 * Converte um modelo de domínio Escalation para DTO
 * @param {Escalation} escalation Objeto Escalation do domínio
 * @returns {Object} DTO para transferência de dados
 */
const toDTO = (escalation) => {
  if (!escalation) return null;

  return {
    id: escalation.id,
    actionId: escalation.actionId,
    commandId: escalation.commandId,
    userId: escalation.userId,
    description: escalation.description,
    status: escalation.status,
    priority: escalation.priority,
    approvers: escalation.approvers,
    department: escalation.department,
    actionDetails: escalation.actionDetails,
    approverId: escalation.approverId,
    approvedAt: escalation.approvedAt,
    approvalNotes: escalation.approvalNotes,
    rejecterId: escalation.rejecterId,
    rejectedAt: escalation.rejectedAt,
    rejectionReason: escalation.rejectionReason,
    cancelerId: escalation.cancelerId,
    canceledAt: escalation.canceledAt,
    expiresAt: escalation.expiresAt,
    createdAt: escalation.createdAt,
    updatedAt: escalation.updatedAt
  };
};

/**
 * Converte um array de modelos Escalation para array de DTOs
 * @param {Array<Escalation>} escalations Array de objetos Escalation
 * @returns {Array<Object>} Array de DTOs
 */
const toDTOList = (escalations) => {
  if (!Array.isArray(escalations)) return [];
  return escalations.map(toDTO);
};

/**
 * DTO para detalhes resumidos da escalação
 * @param {Escalation} escalation Objeto Escalation do domínio
 * @returns {Object} DTO resumido
 */
const toSummaryDTO = (escalation) => {
  if (!escalation) return null;

  return {
    id: escalation.id,
    actionId: escalation.actionId,
    userId: escalation.userId,
    description: escalation.description,
    status: escalation.status,
    priority: escalation.priority,
    department: escalation.department,
    actionName: escalation.actionDetails?.name,
    expiresAt: escalation.expiresAt,
    createdAt: escalation.createdAt
  };
};

/**
 * Converte um array de modelos Escalation para array de DTOs resumidos
 * @param {Array<Escalation>} escalations Array de objetos Escalation
 * @returns {Array<Object>} Array de DTOs resumidos
 */
const toSummaryDTOList = (escalations) => {
  if (!Array.isArray(escalations)) return [];
  return escalations.map(toSummaryDTO);
};

/**
 * DTO para notificação de escalação
 * @param {Escalation} escalation Objeto Escalation do domínio
 * @param {Object} additionalInfo Informações adicionais 
 * @returns {Object} DTO para notificação
 */
const toNotificationDTO = (escalation, additionalInfo = {}) => {
  if (!escalation) return null;

  return {
    id: escalation.id,
    description: escalation.description,
    priority: escalation.priority,
    department: escalation.department,
    actionName: escalation.actionDetails?.name,
    actionDescription: escalation.actionDetails?.description,
    requestedBy: additionalInfo.requestedByName || escalation.userId,
    expiresIn: escalation.expiresAt ? 
      Math.floor((new Date(escalation.expiresAt) - new Date()) / 60000) : null, // minutos
    createdAt: escalation.createdAt
  };
};

module.exports = {
  toDTO,
  toDTOList,
  toSummaryDTO,
  toSummaryDTOList,
  toNotificationDTO
};
