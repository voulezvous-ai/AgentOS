/**
 * DTOs para Action
 * Objetos de transferência de dados para comunicação entre camadas
 */

/**
 * Converte um modelo de domínio Action para DTO
 * @param {Action} action Objeto Action do domínio
 * @returns {Object} DTO para transferência de dados
 */
const toDTO = (action) => {
  if (!action) return null;

  return {
    id: action.id,
    name: action.name,
    description: action.description,
    department: action.department,
    criticality: action.criticality,
    requiredParams: action.requiredParams,
    optionalParams: action.optionalParams,
    params: action.params, // Nota: parâmetros sensíveis deveriam ser sanitizados
    commandId: action.commandId,
    status: action.status,
    result: action.result,
    error: action.error,
    escalationId: action.escalationId,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt
  };
};

/**
 * Converte um array de modelos Action para array de DTOs
 * @param {Array<Action>} actions Array de objetos Action
 * @returns {Array<Object>} Array de DTOs
 */
const toDTOList = (actions) => {
  if (!Array.isArray(actions)) return [];
  return actions.map(toDTO);
};

/**
 * DTO para detalhes resumidos da ação
 * @param {Action} action Objeto Action do domínio
 * @returns {Object} DTO resumido
 */
const toSummaryDTO = (action) => {
  if (!action) return null;

  return {
    id: action.id,
    name: action.name,
    description: action.description,
    department: action.department,
    criticality: action.criticality,
    status: action.status,
    hasResult: !!action.result,
    escalationId: action.escalationId,
    createdAt: action.createdAt
  };
};

/**
 * Converte um array de modelos Action para array de DTOs resumidos
 * @param {Array<Action>} actions Array de objetos Action
 * @returns {Array<Object>} Array de DTOs resumidos
 */
const toSummaryDTOList = (actions) => {
  if (!Array.isArray(actions)) return [];
  return actions.map(toSummaryDTO);
};

/**
 * DTO para definição de ação (uso em configuração e catálogo de ações)
 * @param {Action} action Objeto Action do domínio
 * @returns {Object} DTO de definição
 */
const toDefinitionDTO = (action) => {
  if (!action) return null;

  return {
    name: action.name,
    description: action.description,
    department: action.department,
    criticality: action.criticality,
    requiredParams: action.requiredParams,
    optionalParams: action.optionalParams,
    paramDescriptions: action.paramDescriptions || {}
  };
};

/**
 * Converte um array de modelos Action para array de DTOs de definição
 * @param {Array<Action>} actions Array de objetos Action
 * @returns {Array<Object>} Array de DTOs de definição
 */
const toDefinitionDTOList = (actions) => {
  if (!Array.isArray(actions)) return [];
  return actions.map(toDefinitionDTO);
};

module.exports = {
  toDTO,
  toDTOList,
  toSummaryDTO,
  toSummaryDTOList,
  toDefinitionDTO,
  toDefinitionDTOList
};
