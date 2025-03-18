/**
 * Configuração do serviço Vox
 * Gerencia inicialização e injeção de dependências
 */
const VoxDomainService = require('../../domain/vox/services/VoxDomainService');
const AuditService = require('../../domain/audit/services/AuditService');

// Factories
const CommandFactory = require('../../domain/vox/factories/CommandFactory');
const ActionFactory = require('../../domain/vox/factories/ActionFactory');
const EscalationFactory = require('../../domain/vox/factories/EscalationFactory');

// Casos de uso
const ProcessCommandUseCase = require('../../application/usecases/vox/ProcessCommandUseCase');
const ApproveEscalationUseCase = require('../../application/usecases/vox/ApproveEscalationUseCase');
const RejectEscalationUseCase = require('../../application/usecases/vox/RejectEscalationUseCase');
const GetPendingEscalationsUseCase = require('../../application/usecases/vox/GetPendingEscalationsUseCase');

class VoxServiceConfig {
  /**
   * Inicializa o serviço Vox com as dependências necessárias
   * @param {Object} options Opções de configuração
   * @param {Object} options.db Conexão com o banco de dados
   * @param {Object} options.additionalServices Serviços adicionais opcionais
   * @returns {Object} Serviços e casos de uso configurados
   */
  static async initialize(options = {}) {
    try {
      // Verificar opções necessárias
      if (!options.db) {
        throw new Error('Conexão com o banco de dados é necessária');
      }
      
      // Inicializar coleções do MongoDB
      const db = options.db;
      const commandCollection = db.collection('commands');
      const actionCollection = db.collection('actions');
      const escalationCollection = db.collection('escalations');
      const permissionCollection = db.collection('permissions');
      const auditLogCollection = db.collection('auditLogs');
      
      // Inicializar repositórios
      const CommandRepository = require('../repositories/vox/MongoCommandRepository');
      const ActionRepository = require('../repositories/vox/MongoActionRepository');
      const EscalationRepository = require('../repositories/vox/MongoEscalationRepository');
      const PermissionRepository = require('../repositories/vox/MongoPermissionRepository');
      const AuditLogRepository = require('../repositories/audit/MongoAuditLogRepository');
      
      const commandRepository = new CommandRepository(commandCollection);
      const actionRepository = new ActionRepository(actionCollection);
      const escalationRepository = new EscalationRepository(escalationCollection);
      const permissionRepository = new PermissionRepository(permissionCollection);
      const auditLogRepository = new AuditLogRepository(auditLogCollection);
      
      // Inicializar serviços de domínio
      const auditService = new AuditService(auditLogRepository);
      
      const voxDomainService = new VoxDomainService({
        commandRepository,
        actionRepository,
        escalationRepository,
        permissionRepository,
        auditService
      });
      
      // Inicializar casos de uso
      const processCommandUseCase = new ProcessCommandUseCase(
        voxDomainService,
        auditService,
        options.additionalServices || {}
      );
      
      const approveEscalationUseCase = new ApproveEscalationUseCase(
        voxDomainService,
        auditService,
        options.additionalServices || {}
      );
      
      const rejectEscalationUseCase = new RejectEscalationUseCase(
        voxDomainService,
        auditService,
        options.additionalServices || {}
      );
      
      const getPendingEscalationsUseCase = new GetPendingEscalationsUseCase(
        voxDomainService,
        auditService
      );
      
      // Retornar componentes configurados
      return {
        // Serviços
        voxDomainService,
        auditService,
        
        // Repositórios
        commandRepository,
        actionRepository,
        escalationRepository,
        permissionRepository,
        auditLogRepository,
        
        // Casos de uso
        processCommandUseCase,
        approveEscalationUseCase,
        rejectEscalationUseCase,
        getPendingEscalationsUseCase,
        
        // Factories
        CommandFactory,
        ActionFactory,
        EscalationFactory
      };
    } catch (error) {
      console.error('Erro ao inicializar serviço Vox:', error);
      throw error;
    }
  }

  /**
   * Cria uma instância apenas para testes, usando mocks
   * @returns {Object} Serviços e casos de uso para testes
   */
  static createTestInstance() {
    // Criar mocks de repositórios
    const MockRepository = require('../repositories/__mocks__/MockRepository');
    
    const commandRepository = new MockRepository();
    const actionRepository = new MockRepository();
    const escalationRepository = new MockRepository();
    const permissionRepository = new MockRepository();
    const auditLogRepository = new MockRepository();
    
    // Inicializar serviços de domínio
    const auditService = new AuditService(auditLogRepository);
    
    const voxDomainService = new VoxDomainService({
      commandRepository,
      actionRepository,
      escalationRepository,
      permissionRepository,
      auditService
    });
    
    // Inicializar casos de uso
    const processCommandUseCase = new ProcessCommandUseCase(
      voxDomainService,
      auditService
    );
    
    const approveEscalationUseCase = new ApproveEscalationUseCase(
      voxDomainService,
      auditService
    );
    
    const rejectEscalationUseCase = new RejectEscalationUseCase(
      voxDomainService,
      auditService
    );
    
    const getPendingEscalationsUseCase = new GetPendingEscalationsUseCase(
      voxDomainService,
      auditService
    );
    
    // Retornar componentes configurados
    return {
      // Serviços
      voxDomainService,
      auditService,
      
      // Repositórios
      commandRepository,
      actionRepository,
      escalationRepository,
      permissionRepository,
      auditLogRepository,
      
      // Casos de uso
      processCommandUseCase,
      approveEscalationUseCase,
      rejectEscalationUseCase,
      getPendingEscalationsUseCase,
      
      // Factories
      CommandFactory,
      ActionFactory,
      EscalationFactory
    };
  }
}

module.exports = VoxServiceConfig;
