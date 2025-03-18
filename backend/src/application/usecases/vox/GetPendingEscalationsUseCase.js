/**
 * Caso de uso para consulta de escalações pendentes
 * Recupera as escalações pendentes para um aprovador ou departamento
 */
const EscalationDTO = require('../../../domain/vox/dtos/EscalationDTO');
const { ApplicationError } = require('../../../domain/core/exceptions');

class GetPendingEscalationsUseCase {
  /**
   * @param {import('../../../domain/vox/services/VoxDomainService')} voxDomainService Serviço de domínio Vox
   * @param {import('../../../domain/audit/services/AuditService')} auditService Serviço de auditoria opcional
   */
  constructor(voxDomainService, auditService = null) {
    this.voxDomainService = voxDomainService;
    this.auditService = auditService;
  }

  /**
   * Recupera as escalações pendentes para um aprovador
   * @param {string} approverId ID do aprovador
   * @param {Object} options Opções de paginação e filtragem
   * @returns {Promise<Object>} Escalações pendentes
   */
  async executeForApprover(approverId, options = {}) {
    try {
      // 1. Validar parâmetros
      if (!approverId) {
        throw new ApplicationError('ID do aprovador não fornecido', 'MISSING_APPROVER_ID');
      }
      
      // 2. Obter escalações pendentes do serviço de domínio
      const pendingEscalations = await this.voxDomainService.getPendingEscalationsForApprover(
        approverId,
        this._parseOptions(options)
      );
      
      // 3. Auditoria opcional
      if (this.auditService) {
        await this.auditService.recordEvent({
          eventType: 'ESCALATION_LIST_VIEWED',
          eventSource: 'vox-service',
          userId: approverId,
          resourceType: 'escalation',
          resourceId: 'multiple',
          action: 'list_pending_escalations',
          details: {
            count: pendingEscalations.length,
            filter: 'pending',
            asApprover: true
          }
        });
      }
      
      // 4. Formatar resposta com DTOs
      return {
        escalations: EscalationDTO.toDTOList(pendingEscalations),
        meta: {
          count: pendingEscalations.length,
          ...options
        }
      };
    } catch (error) {
      // Logar e repassar erro
      console.error(`Error getting pending escalations for approver ${approverId}:`, error);
      throw error;
    }
  }

  /**
   * Recupera as escalações pendentes para um departamento
   * @param {string} department Nome do departamento
   * @param {Object} options Opções de paginação e filtragem
   * @param {string} requesterId ID do usuário fazendo a solicitação
   * @returns {Promise<Object>} Escalações pendentes
   */
  async executeByDepartment(department, options = {}, requesterId = null) {
    try {
      // 1. Validar parâmetros
      if (!department) {
        throw new ApplicationError('Departamento não fornecido', 'MISSING_DEPARTMENT');
      }
      
      // 2. Obter escalações pendentes do repositório
      // Primeiro verificamos se o serviço de domínio tem um método específico
      let pendingEscalations;
      
      if (typeof this.voxDomainService.getPendingEscalationsByDepartment === 'function') {
        pendingEscalations = await this.voxDomainService.getPendingEscalationsByDepartment(
          department,
          this._parseOptions(options)
        );
      } else if (this.voxDomainService.escalationRepository) {
        // Caso contrário, acessamos diretamente o repositório se disponível
        pendingEscalations = await this.voxDomainService.escalationRepository.findPendingByDepartment(
          department,
          this._parseOptions(options)
        );
      } else {
        throw new ApplicationError(
          'Método não implementado para buscar escalações por departamento',
          'METHOD_NOT_IMPLEMENTED'
        );
      }
      
      // 3. Auditoria opcional
      if (this.auditService && requesterId) {
        await this.auditService.recordEvent({
          eventType: 'ESCALATION_LIST_VIEWED',
          eventSource: 'vox-service',
          userId: requesterId,
          resourceType: 'escalation',
          resourceId: 'multiple',
          action: 'list_pending_escalations',
          details: {
            count: pendingEscalations.length,
            filter: 'pending',
            department
          }
        });
      }
      
      // 4. Formatar resposta com DTOs
      return {
        escalations: EscalationDTO.toDTOList(pendingEscalations),
        meta: {
          count: pendingEscalations.length,
          department,
          ...options
        }
      };
    } catch (error) {
      // Logar e repassar erro
      console.error(`Error getting pending escalations for department ${department}:`, error);
      throw error;
    }
  }

  /**
   * Recupera todas as escalações pendentes (para administradores)
   * @param {Object} options Opções de paginação e filtragem
   * @param {string} adminId ID do administrador
   * @returns {Promise<Object>} Todas as escalações pendentes
   */
  async executeForAdmin(options = {}, adminId) {
    try {
      // 1. Validar parâmetros de administrador
      if (!adminId) {
        throw new ApplicationError('ID do administrador não fornecido', 'MISSING_ADMIN_ID');
      }
      
      // 2. Obter todas as escalações pendentes
      let pendingEscalations;
      
      if (typeof this.voxDomainService.getAllPendingEscalations === 'function') {
        pendingEscalations = await this.voxDomainService.getAllPendingEscalations(
          this._parseOptions(options)
        );
      } else if (this.voxDomainService.escalationRepository) {
        // Caso contrário, acessamos diretamente o repositório se disponível
        pendingEscalations = await this.voxDomainService.escalationRepository.findByStatus(
          'pending',
          this._parseOptions(options)
        );
      } else {
        throw new ApplicationError(
          'Método não implementado para buscar todas as escalações',
          'METHOD_NOT_IMPLEMENTED'
        );
      }
      
      // 3. Auditoria opcional
      if (this.auditService) {
        await this.auditService.recordEvent({
          eventType: 'ESCALATION_LIST_VIEWED',
          eventSource: 'vox-service',
          userId: adminId,
          resourceType: 'escalation',
          resourceId: 'multiple',
          action: 'list_all_pending_escalations',
          details: {
            count: pendingEscalations.length,
            filter: 'pending',
            asAdmin: true
          }
        });
      }
      
      // 4. Formatar resposta com DTOs
      return {
        escalations: EscalationDTO.toDTOList(pendingEscalations),
        meta: {
          count: pendingEscalations.length,
          ...options
        }
      };
    } catch (error) {
      // Logar e repassar erro
      console.error(`Error getting all pending escalations:`, error);
      throw error;
    }
  }
  
  /**
   * Analisa e valida opções de paginação e filtragem
   * @private
   * @param {Object} options Opções fornecidas
   * @returns {Object} Opções validadas e normalizadas
   */
  _parseOptions(options = {}) {
    const parsedOptions = {
      limit: options.limit && !isNaN(options.limit) ? 
        Math.min(parseInt(options.limit), 100) : 20,
      page: options.page && !isNaN(options.page) ? 
        Math.max(parseInt(options.page), 1) : 1
    };
    
    // Adicionar ordenação se fornecida
    if (options.sort) {
      parsedOptions.sort = options.sort;
      
      if (options.sortDirection) {
        parsedOptions.sortDirection = 
          options.sortDirection.toLowerCase() === 'desc' ? 'desc' : 'asc';
      }
    } else {
      // Ordenação padrão por prioridade e data de criação
      parsedOptions.sort = 'priority';
      parsedOptions.sortDirection = 'desc';
    }
    
    // Adicionar filtros adicionais se fornecidos
    if (options.priority) {
      parsedOptions.priority = options.priority;
    }
    
    if (options.after && !isNaN(new Date(options.after).getTime())) {
      parsedOptions.after = new Date(options.after);
    }
    
    if (options.before && !isNaN(new Date(options.before).getTime())) {
      parsedOptions.before = new Date(options.before);
    }
    
    return parsedOptions;
  }
}

module.exports = GetPendingEscalationsUseCase;
