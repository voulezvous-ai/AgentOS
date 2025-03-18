/**
 * Factory para criação de objetos Escalation
 * Implementa a lógica de criação e validação de dados para Escalation
 */
const { v4: uuidv4 } = require('uuid');
const { DomainError } = require('../../core/exceptions');

class EscalationFactory {
  /**
   * Criar um objeto Escalation a partir de uma ação e comando
   * @param {Object} actionData Dados da ação
   * @param {Object} commandData Dados do comando
   * @param {Object} options Opções adicionais
   * @returns {Object} Objeto Escalation
   */
  static createFromAction(actionData, commandData, options = {}) {
    if (!actionData || !actionData.id) {
      throw new DomainError('Dados da ação inválidos', 'INVALID_ACTION_DATA');
    }
    
    if (!commandData || !commandData.id || !commandData.userId) {
      throw new DomainError('Dados do comando inválidos', 'INVALID_COMMAND_DATA');
    }
    
    // Extrair ou calcular valores necessários
    const actionDepartment = actionData.department || options.department;
    const actionPriority = this._getPriorityFromAction(actionData, options);
    const expirationTime = this._calculateExpirationTime(actionPriority);
    
    // Construir descrição da escalação
    const description = options.description || this._buildDescription(actionData, commandData);
    
    // Determinar aprovadores
    const approvers = this._determineApprovers(actionData, actionDepartment, options);
    
    // Extrair detalhes da ação relevantes para a escalação
    const actionDetails = this._extractActionDetails(actionData);
    
    // Criar objeto escalação
    return {
      id: options.id || uuidv4(),
      actionId: actionData.id,
      commandId: commandData.id,
      userId: commandData.userId,
      description,
      status: 'pending',
      priority: actionPriority,
      approvers,
      department: actionDepartment,
      actionDetails,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: expirationTime
    };
  }

  /**
   * Criar escalação a partir de dados do banco de dados
   * @param {Object} data Dados da escalação do banco
   * @returns {Object} Objeto Escalation
   */
  static createFromDatabase(data) {
    if (!data || !data.id) {
      throw new DomainError('Dados da escalação inválidos', 'INVALID_ESCALATION_DATA');
    }
    
    return {
      id: data.id,
      actionId: data.actionId,
      commandId: data.commandId,
      userId: data.userId,
      description: data.description,
      status: data.status,
      priority: data.priority,
      approvers: data.approvers || [],
      department: data.department,
      actionDetails: data.actionDetails,
      approverId: data.approverId,
      approvedAt: data.approvedAt,
      approvalNotes: data.approvalNotes,
      rejecterId: data.rejecterId,
      rejectedAt: data.rejectedAt,
      rejectionReason: data.rejectionReason,
      cancelerId: data.cancelerId,
      canceledAt: data.canceledAt,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
  }

  /**
   * Aplicar aprovação a uma escalação existente
   * @param {Object} escalation Escalação existente
   * @param {string} approverId ID do aprovador
   * @param {Object} approvalData Dados da aprovação
   * @returns {Object} Escalação atualizada
   */
  static applyApproval(escalation, approverId, approvalData = {}) {
    if (!escalation || !escalation.id) {
      throw new DomainError('Escalação inválida', 'INVALID_ESCALATION');
    }
    
    if (!approverId) {
      throw new DomainError('ID do aprovador não fornecido', 'MISSING_APPROVER_ID');
    }
    
    // Verificar status atual
    if (escalation.status !== 'pending') {
      throw new DomainError(
        `Escalação não pode ser aprovada (status atual: ${escalation.status})`,
        'INVALID_ESCALATION_STATUS'
      );
    }
    
    // Verificar se o aprovador está autorizado
    if (Array.isArray(escalation.approvers) && escalation.approvers.length > 0 && 
        !escalation.approvers.includes(approverId)) {
      throw new DomainError(
        'Aprovador não autorizado para esta escalação',
        'UNAUTHORIZED_APPROVER'
      );
    }
    
    return {
      ...escalation,
      status: 'approved',
      approverId: approverId,
      approvedAt: new Date(),
      approvalNotes: approvalData.notes || null,
      updatedAt: new Date()
    };
  }

  /**
   * Aplicar rejeição a uma escalação existente
   * @param {Object} escalation Escalação existente
   * @param {string} rejecterId ID do rejeitador
   * @param {string} reason Motivo da rejeição
   * @returns {Object} Escalação atualizada
   */
  static applyRejection(escalation, rejecterId, reason) {
    if (!escalation || !escalation.id) {
      throw new DomainError('Escalação inválida', 'INVALID_ESCALATION');
    }
    
    if (!rejecterId) {
      throw new DomainError('ID do rejeitador não fornecido', 'MISSING_REJECTER_ID');
    }
    
    if (!reason) {
      throw new DomainError('Motivo da rejeição não fornecido', 'MISSING_REJECTION_REASON');
    }
    
    // Verificar status atual
    if (escalation.status !== 'pending') {
      throw new DomainError(
        `Escalação não pode ser rejeitada (status atual: ${escalation.status})`,
        'INVALID_ESCALATION_STATUS'
      );
    }
    
    // Verificar se o rejeitador está autorizado (mesma lógica de aprovadores)
    if (Array.isArray(escalation.approvers) && escalation.approvers.length > 0 && 
        !escalation.approvers.includes(rejecterId)) {
      throw new DomainError(
        'Rejeitador não autorizado para esta escalação',
        'UNAUTHORIZED_REJECTER'
      );
    }
    
    return {
      ...escalation,
      status: 'rejected',
      rejecterId: rejecterId,
      rejectedAt: new Date(),
      rejectionReason: reason,
      updatedAt: new Date()
    };
  }

  /**
   * Aplicar cancelamento a uma escalação existente
   * @param {Object} escalation Escalação existente
   * @param {string} cancelerId ID do cancelador
   * @returns {Object} Escalação atualizada
   */
  static applyCancel(escalation, cancelerId) {
    if (!escalation || !escalation.id) {
      throw new DomainError('Escalação inválida', 'INVALID_ESCALATION');
    }
    
    if (!cancelerId) {
      throw new DomainError('ID do cancelador não fornecido', 'MISSING_CANCELER_ID');
    }
    
    // Verificar status atual
    if (escalation.status !== 'pending') {
      throw new DomainError(
        `Escalação não pode ser cancelada (status atual: ${escalation.status})`,
        'INVALID_ESCALATION_STATUS'
      );
    }
    
    // Verificar se o cancelador é o criador da escalação ou um administrador
    // Nota: Implementações reais devem verificar se o cancelador é um administrador
    if (escalation.userId !== cancelerId) {
      throw new DomainError(
        'Apenas o criador da escalação ou um administrador pode cancelá-la',
        'UNAUTHORIZED_CANCELER'
      );
    }
    
    return {
      ...escalation,
      status: 'canceled',
      cancelerId: cancelerId,
      canceledAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Determina a prioridade com base na ação
   * @private
   * @param {Object} actionData Dados da ação
   * @param {Object} options Opções adicionais
   * @returns {string} Prioridade
   */
  static _getPriorityFromAction(actionData, options) {
    // Se há uma prioridade nas opções, usá-la
    if (options.priority) {
      return options.priority;
    }
    
    // Mapear criticidade para prioridade
    const criticality = actionData.criticality || 'medium';
    
    const criticalityMap = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'urgent'
    };
    
    return criticalityMap[criticality] || 'medium';
  }

  /**
   * Calcula o tempo de expiração com base na prioridade
   * @private
   * @param {string} priority Prioridade
   * @returns {Date} Data de expiração
   */
  static _calculateExpirationTime(priority) {
    const now = new Date();
    let hoursToAdd = 24; // Padrão: 24 horas
    
    switch (priority) {
      case 'low':
        hoursToAdd = 72; // 3 dias
        break;
      case 'medium':
        hoursToAdd = 48; // 2 dias
        break;
      case 'high':
        hoursToAdd = 24; // 1 dia
        break;
      case 'urgent':
        hoursToAdd = 12; // 12 horas
        break;
      case 'immediate':
        hoursToAdd = 4; // 4 horas
        break;
    }
    
    now.setHours(now.getHours() + hoursToAdd);
    return now;
  }

  /**
   * Constrói a descrição da escalação
   * @private
   * @param {Object} actionData Dados da ação
   * @param {Object} commandData Dados do comando
   * @returns {string} Descrição formatada
   */
  static _buildDescription(actionData, commandData) {
    const actionName = actionData.name || 'Ação desconhecida';
    const commandQuery = commandData.query || '';
    
    let description = `Solicitação para executar: ${actionName}`;
    
    if (commandQuery) {
      description += `. Comando original: "${commandQuery}"`;
    }
    
    if (actionData.description) {
      description += `. Detalhes: ${actionData.description}`;
    }
    
    return description;
  }

  /**
   * Determina os aprovadores para a escalação
   * @private
   * @param {Object} actionData Dados da ação
   * @param {string} department Departamento
   * @param {Object} options Opções adicionais
   * @returns {Array<string>} Lista de IDs de aprovadores
   */
  static _determineApprovers(actionData, department, options) {
    // Se há aprovadores fornecidos nas opções, usá-los
    if (options.approvers && Array.isArray(options.approvers)) {
      return options.approvers;
    }
    
    // Se há aprovadores definidos na ação, usá-los
    if (actionData.approvers && Array.isArray(actionData.approvers)) {
      return actionData.approvers;
    }
    
    // Usar aprovadores por departamento (lógica simplificada)
    // Em uma implementação real, isso viria de um serviço ou configuração
    const departmentApprovers = {
      financial: ['financial_manager', 'financial_director'],
      hr: ['hr_manager', 'hr_director'],
      security: ['security_manager', 'ciso'],
      it: ['it_manager', 'cto'],
      inventory: ['inventory_manager', 'logistics_director']
    };
    
    return departmentApprovers[department] || ['admin'];
  }

  /**
   * Extrai detalhes da ação para incluir na escalação
   * @private
   * @param {Object} actionData Dados da ação
   * @returns {Object} Detalhes extraídos
   */
  static _extractActionDetails(actionData) {
    // Extrair apenas os campos necessários para apresentação
    const {
      id, name, description, department, criticality, parameters
    } = actionData;
    
    return {
      id,
      name: name || 'Ação sem nome',
      description: description || '',
      department: department || '',
      criticality: criticality || 'medium',
      parameters: parameters || {}
    };
  }
}

module.exports = EscalationFactory;
