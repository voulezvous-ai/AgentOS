/**
 * Caso de uso para aprovação de escalações
 * Coordena o processo de aprovação através dos serviços de domínio
 */
const EscalationDTO = require('../../../domain/vox/dtos/EscalationDTO');
const { DomainError, ApplicationError, NotFoundError } = require('../../../domain/core/exceptions');

class ApproveEscalationUseCase {
  /**
   * @param {import('../../../domain/vox/services/VoxDomainService')} voxDomainService Serviço de domínio Vox
   * @param {import('../../../domain/audit/services/AuditService')} auditService Serviço de auditoria
   * @param {Object} additionalServices Serviços adicionais opcionais
   */
  constructor(voxDomainService, auditService, additionalServices = {}) {
    this.voxDomainService = voxDomainService;
    this.auditService = auditService;
    this.additionalServices = additionalServices;
  }

  /**
   * Aprova uma escalação
   * @param {string} escalationId ID da escalação
   * @param {string} approverId ID do aprovador
   * @param {Object} additionalInfo Informações adicionais
   * @param {Object} context Contexto de execução
   * @returns {Promise<Object>} Resultado da aprovação
   */
  async execute(escalationId, approverId, additionalInfo = {}, context = {}) {
    try {
      // 1. Validar parâmetros
      this._validateParams(escalationId, approverId);
      
      // 2. Obter detalhes do aprovador
      const approver = await this._getApproverDetails(approverId);
      
      // 3. Verificar se o aprovador tem permissão
      await this._verifyApproverPermission(escalationId, approver);
      
      // 4. Enriquecer o contexto de execução
      const enrichedContext = {
        ...context,
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        timestamp: new Date()
      };
      
      // 5. Processar a aprovação no serviço de domínio
      const result = await this.voxDomainService.approveEscalation(
        escalationId, 
        approverId, 
        additionalInfo
      );
      
      // 6. Registrar aprovação na auditoria
      await this.auditService.recordEscalationApproval(
        approverId,
        escalationId,
        result.action.id,
        result.escalation.userId,
        {
          ...additionalInfo,
          ipAddress: enrichedContext.ipAddress
        }
      );
      
      // 7. Notificar o solicitante original (se o serviço estiver disponível)
      await this._notifyRequester(result.escalation, result.action, approver);
      
      // 8. Retornar resposta formatada
      return this._formatResponse(result);
    } catch (error) {
      // Registrar erro na auditoria
      await this.auditService.recordSystemError(
        error,
        'escalation-processor',
        approverId,
        {
          escalationId,
          action: 'approve_escalation'
        }
      );
      
      // Repassar erro de domínio
      if (error instanceof DomainError) {
        throw error;
      }
      
      // Converter outros erros para erro de aplicação
      throw new ApplicationError(
        `Erro ao aprovar escalação: ${error.message}`,
        'ESCALATION_APPROVAL_ERROR',
        error
      );
    }
  }

  /**
   * Valida parâmetros da requisição
   * @private
   * @param {string} escalationId ID da escalação
   * @param {string} approverId ID do aprovador
   */
  _validateParams(escalationId, approverId) {
    if (!escalationId) {
      throw new ApplicationError('ID de escalação não fornecido', 'MISSING_ESCALATION_ID');
    }
    
    if (!approverId) {
      throw new ApplicationError('ID do aprovador não fornecido', 'MISSING_APPROVER_ID');
    }
  }

  /**
   * Obtém detalhes do aprovador
   * @private
   * @param {string} approverId ID do aprovador
   * @returns {Promise<Object>} Informações do aprovador
   */
  async _getApproverDetails(approverId) {
    // Se temos um serviço de usuário disponível, usar para obter detalhes completos
    if (this.additionalServices.userService) {
      try {
        return await this.additionalServices.userService.getUserById(approverId);
      } catch (error) {
        console.warn(`Failed to get approver details: ${error.message}`);
        // Continuar com informações limitadas
      }
    }
    
    // Retornar informações básicas do aprovador
    return {
      id: approverId,
      roles: [] // Implementação real obteria papéis do usuário
    };
  }

  /**
   * Verifica se o aprovador tem permissão para aprovar a escalação
   * @private
   * @param {string} escalationId ID da escalação
   * @param {Object} approver Informações do aprovador
   * @returns {Promise<void>}
   */
  async _verifyApproverPermission(escalationId, approver) {
    // Verificar se temos acesso ao repositório de escalação
    if (!this.voxDomainService.escalationRepository) {
      // Assumir que a verificação será feita pelo serviço de domínio
      return;
    }
    
    // Obter a escalação
    const escalation = await this.voxDomainService.escalationRepository.findById(escalationId);
    if (!escalation) {
      throw new NotFoundError('Escalação não encontrada', 'ESCALATION_NOT_FOUND');
    }
    
    // Verificar se a escalação já foi processada
    if (escalation.status !== 'pending') {
      throw new ApplicationError(
        `Esta escalação já foi ${escalation.status === 'approved' ? 'aprovada' : 'processada'}`,
        'ESCALATION_ALREADY_PROCESSED'
      );
    }
    
    // Verificar se o aprovador está na lista de aprovadores
    const isAllowedApprover = 
      Array.isArray(escalation.approvers) && 
      (escalation.approvers.includes(approver.id) || 
       approver.roles.some(role => escalation.approvers.includes(role)));
    
    if (!isAllowedApprover) {
      throw new ApplicationError(
        'Você não tem permissão para aprovar esta escalação',
        'UNAUTHORIZED_APPROVAL'
      );
    }
  }

  /**
   * Notifica o solicitante original sobre a aprovação
   * @private
   * @param {Object} escalation Escalação aprovada
   * @param {Object} action Ação executada
   * @param {Object} approver Informações do aprovador
   * @returns {Promise<void>}
   */
  async _notifyRequester(escalation, action, approver) {
    // Se não temos um serviço de notificação, não fazer nada
    if (!this.additionalServices.notificationService) {
      return;
    }
    
    try {
      await this.additionalServices.notificationService.sendNotification({
        userId: escalation.userId,
        type: 'escalation_approved',
        title: 'Escalação Aprovada',
        message: `Sua solicitação para executar "${action.name}" foi aprovada`,
        data: {
          escalationId: escalation.id,
          actionId: action.id,
          actionName: action.name,
          approvedBy: approver.id,
          approvedAt: escalation.approvedAt || new Date()
        }
      });
    } catch (error) {
      // Apenas logar o erro, não interromper o fluxo principal
      console.error('Failed to send notification:', error.message);
    }
  }

  /**
   * Formata a resposta do caso de uso
   * @private
   * @param {Object} result Resultado do processamento
   * @returns {Object} Resposta formatada
   */
  _formatResponse(result) {
    // Converter objetos de domínio para DTOs
    const formattedResult = { ...result };
    
    if (result.escalation) {
      formattedResult.escalation = EscalationDTO.toDTO(result.escalation);
    }
    
    if (result.action) {
      const ActionDTO = require('../../../domain/vox/dtos/ActionDTO');
      formattedResult.action = ActionDTO.toDTO(result.action);
    }
    
    return formattedResult;
  }
}

module.exports = ApproveEscalationUseCase;
