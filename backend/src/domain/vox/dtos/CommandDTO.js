/**
 * DTOs para Command
 * Objetos de transferência de dados para comunicação entre camadas
 */

/**
 * Converte um modelo de domínio Command para DTO
 * @param {Command} command Objeto Command do domínio
 * @returns {Object} DTO para transferência de dados
 */
const toDTO = (command) => {
  if (!command) return null;

  return {
    id: command.id,
    query: command.query,
    userId: command.userId,
    sessionId: command.sessionId,
    source: command.source,
    status: command.status,
    intent: command.intent,
    intentConfidence: command.intentConfidence,
    entities: command.entities,
    escalationId: command.escalationId,
    escalationApprovers: command.escalationApprovers,
    result: command.result,
    processingTime: command.processingTime,
    error: command.error,
    createdAt: command.createdAt,
    updatedAt: command.updatedAt
  };
};

/**
 * Converte um array de modelos Command para array de DTOs
 * @param {Array<Command>} commands Array de objetos Command
 * @returns {Array<Object>} Array de DTOs
 */
const toDTOList = (commands) => {
  if (!Array.isArray(commands)) return [];
  return commands.map(toDTO);
};

/**
 * DTO para detalhes resumidos do comando
 * @param {Command} command Objeto Command do domínio
 * @returns {Object} DTO resumido
 */
const toSummaryDTO = (command) => {
  if (!command) return null;

  return {
    id: command.id,
    query: command.query,
    status: command.status,
    intent: command.intent,
    result: command.result ? {
      success: command.result.success,
      message: command.result.message
    } : null,
    createdAt: command.createdAt
  };
};

/**
 * Converte um array de modelos Command para array de DTOs resumidos
 * @param {Array<Command>} commands Array de objetos Command
 * @returns {Array<Object>} Array de DTOs resumidos
 */
const toSummaryDTOList = (commands) => {
  if (!Array.isArray(commands)) return [];
  return commands.map(toSummaryDTO);
};

module.exports = {
  toDTO,
  toDTOList,
  toSummaryDTO,
  toSummaryDTOList
};
