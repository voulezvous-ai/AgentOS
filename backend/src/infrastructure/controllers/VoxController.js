/**
 * Controlador REST para o serviço Vox
 * Expõe os casos de uso como endpoints de API
 */
const { ApplicationError, ValidationError, NotFoundError } = require('../../domain/core/exceptions');

class VoxController {
  /**
   * @param {import('../../application/usecases/vox/ProcessCommandUseCase')} processCommandUseCase 
   * @param {import('../../application/usecases/vox/ApproveEscalationUseCase')} approveEscalationUseCase 
   * @param {import('../../application/usecases/vox/RejectEscalationUseCase')} rejectEscalationUseCase 
   * @param {import('../../application/usecases/vox/GetPendingEscalationsUseCase')} getPendingEscalationsUseCase 
   */
  constructor(
    processCommandUseCase,
    approveEscalationUseCase,
    rejectEscalationUseCase,
    getPendingEscalationsUseCase
  ) {
    this.processCommandUseCase = processCommandUseCase;
    this.approveEscalationUseCase = approveEscalationUseCase;
    this.rejectEscalationUseCase = rejectEscalationUseCase;
    this.getPendingEscalationsUseCase = getPendingEscalationsUseCase;
  }

  /**
   * Processa um comando de texto do Vox
   * POST /api/vox/commands
   * @param {Object} req Requisição Express
   * @param {Object} res Resposta Express
   * @param {Function} next Função next do Express
   */
  async processCommand(req, res, next) {
    try {
      const { query, userId, sessionId } = req.body;
      
      if (!query || !userId || !sessionId) {
        throw new ValidationError('Dados inválidos', [
          { field: 'query', message: 'Consulta é obrigatória' },
          { field: 'userId', message: 'ID do usuário é obrigatório' },
          { field: 'sessionId', message: 'ID da sessão é obrigatório' }
        ]);
      }
      
      // Criar contexto de execução baseado na requisição
      const context = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      };
      
      // Executar caso de uso
      const result = await this.processCommandUseCase.execute(req.body, context);
      
      // Retornar resposta
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Processa um comando de voz do Vox
   * POST /api/vox/voice-commands
   * @param {Object} req Requisição Express
   * @param {Object} res Resposta Express
   * @param {Function} next Função next do Express
   */
  async processVoiceCommand(req, res, next) {
    try {
      const { audioUrl, userId, sessionId } = req.body;
      
      if (!audioUrl || !userId || !sessionId) {
        throw new ValidationError('Dados inválidos', [
          { field: 'audioUrl', message: 'URL do áudio é obrigatória' },
          { field: 'userId', message: 'ID do usuário é obrigatório' },
          { field: 'sessionId', message: 'ID da sessão é obrigatório' }
        ]);
      }
      
      // Em uma implementação real, aqui seria feito o processamento do áudio
      // para transcrição em texto antes de chamar o caso de uso
      
      // Simulação de transcrição (em produção, usaria um serviço real)
      const transcriptedText = "Comando de voz simulado";
      
      // Criar contexto de execução baseado na requisição
      const context = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        source: 'voice'
      };
      
      // Executar caso de uso com o texto transcrito
      const result = await this.processCommandUseCase.execute({
        query: transcriptedText,
        userId,
        sessionId,
        source: 'voice',
        originalAudioUrl: audioUrl
      }, context);
      
      // Retornar resposta
      res.status(200).json({
        success: true,
        data: {
          transcription: transcriptedText,
          ...result
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Aprova uma escalação
   * POST /api/vox/escalations/:id/approve
   * @param {Object} req Requisição Express
   * @param {Object} res Resposta Express
   * @param {Function} next Função next do Express
   */
  async approveEscalation(req, res, next) {
    try {
      const { id } = req.params;
      const { approverId, notes } = req.body;
      
      if (!id || !approverId) {
        throw new ValidationError('Dados inválidos', [
          { field: 'id', message: 'ID da escalação é obrigatório' },
          { field: 'approverId', message: 'ID do aprovador é obrigatório' }
        ]);
      }
      
      // Criar contexto de execução baseado na requisição
      const context = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      };
      
      // Executar caso de uso
      const result = await this.approveEscalationUseCase.execute(
        id, 
        approverId, 
        { notes }, 
        context
      );
      
      // Retornar resposta
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rejeita uma escalação
   * POST /api/vox/escalations/:id/reject
   * @param {Object} req Requisição Express
   * @param {Object} res Resposta Express
   * @param {Function} next Função next do Express
   */
  async rejectEscalation(req, res, next) {
    try {
      const { id } = req.params;
      const { rejecterId, reason } = req.body;
      
      if (!id || !rejecterId || !reason) {
        throw new ValidationError('Dados inválidos', [
          { field: 'id', message: 'ID da escalação é obrigatório' },
          { field: 'rejecterId', message: 'ID do rejeitador é obrigatório' },
          { field: 'reason', message: 'Motivo da rejeição é obrigatório' }
        ]);
      }
      
      // Criar contexto de execução baseado na requisição
      const context = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      };
      
      // Executar caso de uso
      const result = await this.rejectEscalationUseCase.execute(
        id, 
        rejecterId, 
        reason, 
        context
      );
      
      // Retornar resposta
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém escalações pendentes para um aprovador
   * GET /api/vox/escalations/pending/approver/:approverId
   * @param {Object} req Requisição Express
   * @param {Object} res Resposta Express
   * @param {Function} next Função next do Express
   */
  async getPendingEscalationsForApprover(req, res, next) {
    try {
      const { approverId } = req.params;
      
      if (!approverId) {
        throw new ValidationError('ID do aprovador é obrigatório');
      }
      
      // Extrair opções de paginação e filtragem
      const options = this._extractPaginationOptions(req);
      
      // Executar caso de uso
      const result = await this.getPendingEscalationsUseCase.executeForApprover(
        approverId,
        options
      );
      
      // Retornar resposta
      res.status(200).json({
        success: true,
        data: result.escalations,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém escalações pendentes para um departamento
   * GET /api/vox/escalations/pending/department/:department
   * @param {Object} req Requisição Express
   * @param {Object} res Resposta Express
   * @param {Function} next Função next do Express
   */
  async getPendingEscalationsForDepartment(req, res, next) {
    try {
      const { department } = req.params;
      const { requesterId } = req.query;
      
      if (!department) {
        throw new ValidationError('Departamento é obrigatório');
      }
      
      // Extrair opções de paginação e filtragem
      const options = this._extractPaginationOptions(req);
      
      // Executar caso de uso
      const result = await this.getPendingEscalationsUseCase.executeByDepartment(
        department,
        options,
        requesterId
      );
      
      // Retornar resposta
      res.status(200).json({
        success: true,
        data: result.escalations,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém todas as escalações pendentes (apenas para administradores)
   * GET /api/vox/escalations/pending
   * @param {Object} req Requisição Express
   * @param {Object} res Resposta Express
   * @param {Function} next Função next do Express
   */
  async getAllPendingEscalations(req, res, next) {
    try {
      const { adminId } = req.query;
      
      if (!adminId) {
        throw new ValidationError('ID do administrador é obrigatório');
      }
      
      // Extrair opções de paginação e filtragem
      const options = this._extractPaginationOptions(req);
      
      // Executar caso de uso
      const result = await this.getPendingEscalationsUseCase.executeForAdmin(
        options,
        adminId
      );
      
      // Retornar resposta
      res.status(200).json({
        success: true,
        data: result.escalations,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extrai opções de paginação e filtragem da requisição
   * @private
   * @param {Object} req Requisição Express
   * @returns {Object} Opções extraídas
   */
  _extractPaginationOptions(req) {
    const options = {};
    
    // Paginação
    if (req.query.limit) {
      options.limit = parseInt(req.query.limit);
    }
    
    if (req.query.page) {
      options.page = parseInt(req.query.page);
    }
    
    // Ordenação
    if (req.query.sort) {
      options.sort = req.query.sort;
    }
    
    if (req.query.sortDirection) {
      options.sortDirection = req.query.sortDirection;
    }
    
    // Filtros
    if (req.query.priority) {
      options.priority = req.query.priority;
    }
    
    if (req.query.after) {
      options.after = new Date(req.query.after);
    }
    
    if (req.query.before) {
      options.before = new Date(req.query.before);
    }
    
    return options;
  }

  /**
   * Configura as rotas do controlador em uma instância Express
   * @param {Object} app Instância do Express
   * @param {string} baseUrl URL base para as rotas
   * @returns {Object} Router configurado
   */
  static configureRoutes(app, baseUrl, controller) {
    const express = require('express');
    const router = express.Router();
    
    // Rotas para comandos
    router.post('/commands', controller.processCommand.bind(controller));
    router.post('/voice-commands', controller.processVoiceCommand.bind(controller));
    
    // Rotas para escalações
    router.post('/escalations/:id/approve', controller.approveEscalation.bind(controller));
    router.post('/escalations/:id/reject', controller.rejectEscalation.bind(controller));
    router.get('/escalations/pending/approver/:approverId', controller.getPendingEscalationsForApprover.bind(controller));
    router.get('/escalations/pending/department/:department', controller.getPendingEscalationsForDepartment.bind(controller));
    router.get('/escalations/pending', controller.getAllPendingEscalations.bind(controller));
    
    // Registrar rotas na aplicação
    app.use(baseUrl, router);
    
    return router;
  }
}

module.exports = VoxController;
