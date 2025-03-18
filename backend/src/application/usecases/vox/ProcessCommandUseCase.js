/**
 * Caso de uso para processamento de comandos do Vox
 * Coordena o processamento de comandos através dos serviços de domínio
 */
const CommandFactory = require('../../../domain/vox/factories/CommandFactory');
const CommandDTO = require('../../../domain/vox/dtos/CommandDTO');
const { DomainError, ApplicationError } = require('../../../domain/core/exceptions');

class ProcessCommandUseCase {
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
   * Processa um comando de texto
   * @param {Object} requestData Dados da requisição
   * @param {string} requestData.query Texto da consulta
   * @param {string} requestData.userId ID do usuário
   * @param {string} requestData.sessionId ID da sessão
   * @param {Object} requestData.metadata Metadados adicionais
   * @param {Object} context Contexto de execução
   * @returns {Promise<Object>} Resultado do processamento
   */
  async execute(requestData, context = {}) {
    try {
      // 1. Validar dados da requisição
      this._validateRequest(requestData);
      
      // 2. Criar objeto de comando a partir dos dados da requisição
      const command = CommandFactory.createFromRequest({
        ...requestData,
        source: requestData.source || 'text'
      });
      
      // 3. Obter detalhes do usuário (pode ser expandido com mais dados se necessário)
      const user = await this._getUserDetails(requestData.userId);
      
      // 4. Enriquecer o contexto de execução
      const enrichedContext = {
        ...context,
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        timestamp: new Date()
      };
      
      // 5. Registrar auditoria de recebimento do comando
      await this.auditService.recordVoxCommand(
        requestData.userId,
        command.id,
        command.query,
        { intent: null, confidence: 0, entities: [] },
        command.sessionId
      );
      
      // 6. Processamento do comando pelo serviço de domínio
      const result = await this.voxDomainService.processCommand(
        command,
        user,
        enrichedContext
      );
      
      // 7. Processar resultados específicos
      await this._handleSpecificResults(result, user, enrichedContext);
      
      // 8. Retornar resposta formatada
      return this._formatResponse(result);
    } catch (error) {
      // Registrar erro na auditoria
      if (requestData && requestData.userId) {
        await this.auditService.recordSystemError(
          error,
          'vox-command-processor',
          requestData.userId,
          {
            query: requestData.query,
            sessionId: requestData.sessionId,
            action: 'process_command'
          }
        );
      }
      
      // Repassar erro de domínio
      if (error instanceof DomainError) {
        throw error;
      }
      
      // Converter outros erros para erro de aplicação
      throw new ApplicationError(
        `Erro ao processar comando: ${error.message}`,
        'COMMAND_PROCESSING_ERROR',
        error
      );
    }
  }

  /**
   * Valida dados da requisição
   * @private
   * @param {Object} requestData Dados da requisição
   */
  _validateRequest(requestData) {
    if (!requestData) {
      throw new ApplicationError('Dados da requisição não fornecidos', 'MISSING_REQUEST_DATA');
    }
    
    const requiredFields = ['query', 'userId', 'sessionId'];
    for (const field of requiredFields) {
      if (!requestData[field]) {
        throw new ApplicationError(`Campo obrigatório não fornecido: ${field}`, 'MISSING_REQUIRED_FIELD');
      }
    }
    
    if (typeof requestData.query !== 'string' || requestData.query.trim().length < 2) {
      throw new ApplicationError('Consulta inválida', 'INVALID_QUERY');
    }
  }

  /**
   * Obtém detalhes do usuário
   * @private
   * @param {string} userId ID do usuário
   * @returns {Promise<Object>} Informações do usuário
   */
  async _getUserDetails(userId) {
    // Se temos um serviço de usuário disponível, usar para obter detalhes completos
    if (this.additionalServices.userService) {
      try {
        return await this.additionalServices.userService.getUserById(userId);
      } catch (error) {
        console.warn(`Failed to get user details: ${error.message}`);
        // Continuar com informações limitadas
      }
    }
    
    // Retornar informações básicas do usuário
    return {
      id: userId,
      roles: [] // Implementação real obteria papéis do usuário
    };
  }

  /**
   * Processa resultados específicos
   * @private
   * @param {Object} result Resultado do processamento
   * @param {Object} user Informações do usuário
   * @param {Object} context Contexto de execução
   * @returns {Promise<void>}
   */
  async _handleSpecificResults(result, user, context) {
    // Caso o resultado exija confirmação, podemos realizar ações específicas
    if (result.requiresConfirmation) {
      // Exemplo: registrar auditoria específica, enviar notificação, etc.
      // Por enquanto apenas um placeholder
      console.log('Action requires confirmation:', result.action?.id);
    }
    
    // Caso o resultado seja uma escalação
    if (result.requiresApproval && result.escalationId) {
      // Exemplo: Notificar aprovadores, registrar auditoria específica, etc.
      // Por enquanto apenas um placeholder
      console.log('Action escalated:', result.escalationId);
    }
  }

  /**
   * Formata a resposta do caso de uso
   * @private
   * @param {Object} result Resultado do processamento
   * @returns {Object} Resposta formatada
   */
  _formatResponse(result) {
    // Converter objetos de domínio para DTOs se existirem
    const formattedResult = { ...result };
    
    if (result.command) {
      formattedResult.command = CommandDTO.toDTO(result.command);
    }
    
    if (result.action) {
      const ActionDTO = require('../../../domain/vox/dtos/ActionDTO');
      formattedResult.action = ActionDTO.toDTO(result.action);
    }
    
    if (result.escalation) {
      const EscalationDTO = require('../../../domain/vox/dtos/EscalationDTO');
      formattedResult.escalation = EscalationDTO.toDTO(result.escalation);
    }
    
    return formattedResult;
  }
}

module.exports = ProcessCommandUseCase;
