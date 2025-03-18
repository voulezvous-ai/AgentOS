/**
 * Caso de uso para rejeição de escalações
 * Coordena o processo de rejeição através dos serviços de domínio
 */
const EscalationDTO = require('../../../domain/vox/dtos/EscalationDTO');
const { DomainError, ApplicationError, NotFoundError } = require('../../../domain/core/exceptions');

class RejectEscalationUseCase {
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
   * Rejeita uma escalação
   * @param {string} escalationId ID da escalação
   * @param {string} rejecterId ID do rejeitador
   * @param {string} reason Motivo da rejeição
   * @param {Object} context Contexto de execução
   * @returns {Promise<Object>} Resultado da rejeição
   */
  async execute(escalationId, rejecterId, reason, context = {}) {
    try {
      // 1. Validar parâmetros
      this._validateParams(escalationId, rejecterId, reason);
      
      // 2. Obter detalhes do rejeitador
      const rejecter = await this._getRejecterDetails(rejecterId);
      
      // 3. Verificar se o rejeitador tem permissão
      await this._verifyRejecterPermission(escalationId, rejecter);
      
      // 4. Enriquecer o contexto de execução
      const enrichedContext = {
        ...context,
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        timestamp: new Date()
      };
      
      // 5. Processar a rejeição no serviço de domínio
      const result = await this.voxDomainService.rejectEscalation(
        escalationId, 
        rejecterId, 
        reason
      );
      
      // 6. Registrar rejeição na auditoria
      await this.auditService.recordEscalationRejection(
        rejecterId,
        escalationId,
        result.action.id,
        result.escalation.userId,
        reason,
        {
          ipAddress: enrichedContext.ipAddress
        }
      );
      
      // 7. Notificar o solicitante original (se o serviço estiver disponível)
      await this._notifyRequester(result.escalation, result.action, rejecter, reason);
      
      // 8. Retornar resposta formatada
      return this._formatResponse(result);
    } catch (error) {
      // Registrar erro na auditoria
      await this.auditService.recordSystemError(
        error,
        'escalation-processor',
        rejecterId,
        {
          escalationId,
          action: 'reject_escalation'
        }
      );
      
      // Repassar erro de domínio
      if (error instanceof DomainError) {
        throw error;
      }
      
      // Converter outros erros para erro de aplicação
      throw new ApplicationError(
        `Erro ao rejeitar escalação: ${error.message}`,
        'ESCALATION_REJECTION_ERROR',
        error
      );
    }
  }

  /**
   * Valida parâmetros da requisição
   * @private
   * @param {string} escalationId ID da escalação
   * @param {string} rejecterId ID do rejeitador
   * @param {string} reason Motivo da rejeição
   */
  _validateParams(escalationId, rejecterId, reason) {
    if (!escalationId) {
      throw new ApplicationError('ID de escalação não fornecido', 'MISSING_ESCALATION_ID');
    }
    
    if (!rejecterId) {
      throw new ApplicationError('ID do rejeitador não fornecido', 'MISSING_REJECTER_ID');
    }
    
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw new ApplicationError('Motivo da rejeição é obrigatório', 'MISSING_REJECTION_REASON');
    }
  }

  /**
   * Obtém detalhes do rejeitador
   * @private
   * @param {string} rejecterId ID do rejeitador
   * @returns {Promise<Object>} Informações do rejeitador
   */
  async _getRejecterDetails(rejecterId) {
    // Se temos um serviço de usuário disponível, usar para obter detalhes completos
    if (this.additionalServices.userService) {
      try {
        return await this.additionalServices.userService.getUserById(rejecterId);
      } catch (error) {
        console.warn(`Failed to get rejecter details: ${error.message}`);
        // Continuar com informações limitadas
      }
    }
    
    // Retornar informações básicas do rejeitador
    return {
      id: rejecterId,
      roles: [] // Implementação real obteria papéis do usuário
    };
  }

  /**
   * Verifica se o rejeitador tem permissão para rejeitar a escalação
   * @private
   * @param {string} escalationId ID da escalação
   * @param {Object} rejecter Informações do rejeitador
   * @returns {Promise<void>}
   */
  async _verifyRejecterPermission(escalationId, rejecter) {
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
    
    // Verificar se o rejeitador está na lista de aprovadores (quem pode aprovar pode rejeitar)
    const isAllowedRejecter = 
      Array.isArray(escalation.approvers) && 
      (escalation.approvers.includes(rejecter.id) || 
       rejecter.roles.some(role => escalation.approvers.includes(role)));
    
    if (!isAllowedRejecter) {
      throw new ApplicationError(
        'Você não tem permissão para rejeitar esta escalação',
        'UNAUTHORIZED_REJECTION'
      );
    }
  }

  /**
   * Notifica o solicitante original sobre a rejeição
   * @private
   * @param {Object} escalation Escalação rejeitada
   * @param {Object} action Ação relacionada
   * @param {Object} rejecter Informações do rejeitador
   * @param {string} reason Motivo da rejeição
   * @returns {Promise<void>}
   */
  async _notifyRequester(escalation, action, rejecter, reason) {
    // Se não temos um serviço de notificação, não fazer nada
    if (!this.additionalServices.notificationService) {
      return;
    }
    
    try {
      await this.additionalServices.notificationService.sendNotification({
        userId: escalation.userId,
        type: 'escalation_rejected',
        title: 'Escalação Rejeitada',
        message: `Sua solicitação para executar "${action.name}" foi rejeitada`,
        data: {
          escalationId: escalation.id,
          actionId: action.id,
          actionName: action.name,
          rejectedBy: rejecter.id,
          rejectedAt: escalation.rejectedAt || new Date(),
          reason
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

module.exports = RejectEscalationUseCase;
