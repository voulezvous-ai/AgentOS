/**
 * Controlador de Auditoria
 * Gerencia consultas e visualizações de logs de auditoria
 */

const AuditLog = require('../../../common/models/auditLog');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../../common/config/logger');
const { AppError } = require('../../../common/utils/errorHandler');

/**
 * Obter logs de auditoria com filtros
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
exports.getLogs = async (req, res, next) => {
  try {
    const {
      service,
      userId,
      type,
      level,
      action,
      startDate,
      endDate,
      status,
      limit = 100,
      page = 1,
      sort = 'desc'
    } = req.query;

    const filter = {};

    // Aplicar filtros
    if (service) filter.service = service;
    if (userId) filter.userId = userId;
    if (type) filter.type = type;
    if (level) filter.level = level;
    if (action) filter.action = action;
    if (status) filter.status = status;

    // Filtro de data
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Calcular paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sort === 'asc' ? 1 : -1;

    // Executar consulta
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: sortDirection })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Contar total de resultados para paginação
    const total = await AuditLog.countDocuments(filter);

    logger.info(`Audit logs consulted with filters: ${JSON.stringify(filter)}`);

    // Retornar resultados com metadados de paginação
    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Error retrieving audit logs: ${error.message}`);
    next(error);
  }
};

/**
 * Obter detalhes de um log específico de auditoria
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
exports.getLogById = async (req, res, next) => {
  try {
    const { auditId } = req.params;

    if (!auditId) {
      throw new AppError('ID de auditoria é obrigatório', 400);
    }

    // Buscar log por ID
    const log = await AuditLog.findOne({ auditId }).lean();

    if (!log) {
      throw new AppError('Log de auditoria não encontrado', 404);
    }

    // Buscar logs relacionados
    const relatedLogs = await AuditLog.find({ relatedLogs: auditId })
      .sort({ timestamp: -1 })
      .lean();

    logger.info(`Audit log ${auditId} details retrieved`);

    // Retornar log com logs relacionados
    res.json({
      success: true,
      data: {
        ...log,
        relatedLogs: relatedLogs.length > 0 ? relatedLogs : undefined
      }
    });
  } catch (error) {
    logger.error(`Error retrieving audit log details: ${error.message}`);
    next(error);
  }
};

/**
 * Obter estatísticas e resumo de logs de auditoria
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
exports.getAuditStats = async (req, res, next) => {
  try {
    const { startDate, endDate, service } = req.query;

    const filter = {};

    // Aplicar filtros
    if (service) filter.service = service;

    // Filtro de data
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Pipeline de agregação para estatísticas
    const stats = await AuditLog.aggregate([
      { $match: filter },
      {
        $facet: {
          // Contagem por serviço
          byService: [
            { $group: { _id: '$service', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          // Contagem por tipo
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          // Contagem por nível
          byLevel: [
            { $group: { _id: '$level', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          // Contagem por status
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          // Contagem por dia
          byDay: [
            {
              $group: {
                _id: {
                  year: { $year: '$timestamp' },
                  month: { $month: '$timestamp' },
                  day: { $dayOfMonth: '$timestamp' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
            { $limit: 30 } // Últimos 30 dias
          ],
          // Tempos de resposta médios (para logs de performance)
          responseTimesAvg: [
            { $match: { 'details.responseTime': { $exists: true } } },
            {
              $group: {
                _id: '$details.operation',
                avgTime: { $avg: '$details.responseTime' },
                minTime: { $min: '$details.responseTime' },
                maxTime: { $max: '$details.responseTime' },
                count: { $sum: 1 }
              }
            },
            { $sort: { avgTime: -1 } },
            { $limit: 10 }
          ],
          // Total de logs
          total: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    // Formatar dados de estatísticas para melhor visualização
    const formattedStats = {
      total: stats[0].total.length > 0 ? stats[0].total[0].count : 0,
      byService: stats[0].byService.map(item => ({ service: item._id, count: item.count })),
      byType: stats[0].byType.map(item => ({ type: item._id, count: item.count })),
      byLevel: stats[0].byLevel.map(item => ({ level: item._id, count: item.count })),
      byStatus: stats[0].byStatus.map(item => ({ status: item._id, count: item.count })),
      byDay: stats[0].byDay.map(item => ({
        date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
        count: item.count
      })),
      responseTimesAvg: stats[0].responseTimesAvg.map(item => ({
        operation: item._id,
        avgTime: Math.round(item.avgTime),
        minTime: item.minTime,
        maxTime: item.maxTime,
        count: item.count
      }))
    };

    logger.info('Audit statistics retrieved');

    // Retornar estatísticas
    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    logger.error(`Error retrieving audit statistics: ${error.message}`);
    next(error);
  }
};

/**
 * Obter logs de auditoria de um usuário específico
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
exports.getUserActivityLogs = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 100, page = 1, startDate, endDate } = req.query;

    if (!userId) {
      throw new AppError('ID de usuário é obrigatório', 400);
    }

    const filter = { userId };

    // Filtro de data
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Calcular paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Executar consulta
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Contar total de resultados para paginação
    const total = await AuditLog.countDocuments(filter);

    logger.info(`User ${userId} activity logs retrieved`);

    // Retornar resultados com metadados de paginação
    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Error retrieving user activity logs: ${error.message}`);
    next(error);
  }
};

/**
 * Pesquisar logs de auditoria com texto completo
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
exports.searchLogs = async (req, res, next) => {
  try {
    const { query, limit = 100, page = 1 } = req.query;

    if (!query) {
      throw new AppError('Termo de pesquisa é obrigatório', 400);
    }

    // Calcular paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Executar pesquisa de texto completo
    const logs = await AuditLog.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Contar total de resultados para paginação
    const total = await AuditLog.countDocuments({ $text: { $search: query } });

    logger.info(`Audit logs searched with query: "${query}"`);

    // Retornar resultados com metadados de paginação
    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Error searching audit logs: ${error.message}`);
    next(error);
  }
};

/**
 * Exportar logs de auditoria para CSV
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
exports.exportLogs = async (req, res, next) => {
  try {
    const {
      service,
      userId,
      type,
      level,
      action,
      startDate,
      endDate,
      status,
      format = 'csv'
    } = req.query;

    const filter = {};

    // Aplicar filtros
    if (service) filter.service = service;
    if (userId) filter.userId = userId;
    if (type) filter.type = type;
    if (level) filter.level = level;
    if (action) filter.action = action;
    if (status) filter.status = status;

    // Filtro de data
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Executar consulta (limitado a 10000 registros para exportação)
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(10000)
      .lean();

    logger.info(`Exporting ${logs.length} audit logs to ${format}`);

    // Determinar formato de exportação
    if (format.toLowerCase() === 'csv') {
      // Gerar CSV
      let csv = 'Data,Serviço,Tipo,Nível,Usuário,Ação,Status,Mensagem,ID\n';
      
      logs.forEach(log => {
        const timestamp = new Date(log.timestamp).toISOString();
        const service = log.service || '';
        const type = log.type || '';
        const level = log.level || '';
        const userId = log.userId || '';
        const action = log.action || '';
        const status = log.status || '';
        const message = (log.message || '').replace(/"/g, '""'); // Escapar aspas duplas
        const auditId = log.auditId || '';
        
        csv += `"${timestamp}","${service}","${type}","${level}","${userId}","${action}","${status}","${message}","${auditId}"\n`;
      });
      
      // Configurar cabeçalhos para download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
      
      return res.send(csv);
    } else if (format.toLowerCase() === 'json') {
      // Configurar cabeçalhos para download JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.json');
      
      return res.json({
        exported: new Date(),
        count: logs.length,
        logs
      });
    } else {
      throw new AppError('Formato de exportação não suportado', 400);
    }
  } catch (error) {
    logger.error(`Error exporting audit logs: ${error.message}`);
    next(error);
  }
};

/**
 * Criar manualmente um log de auditoria (para sistemas externos)
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
exports.createManualLog = async (req, res, next) => {
  try {
    const {
      service,
      type,
      level,
      message,
      userId,
      action,
      details,
      status = 'info'
    } = req.body;

    // Validar campos obrigatórios
    if (!service || !message) {
      throw new AppError('Campos obrigatórios: service, message', 400);
    }

    // Criar log
    const auditLog = new AuditLog({
      service,
      type: type || 'system',
      level: level || 'info',
      message,
      userId,
      action,
      details,
      status,
      auditId: uuidv4(),
      timestamp: new Date()
    });

    // Salvar log
    await auditLog.save();

    logger.info(`Manual audit log created for service ${service}`);

    // Retornar log criado
    res.status(201).json({
      success: true,
      data: auditLog
    });
  } catch (error) {
    logger.error(`Error creating manual audit log: ${error.message}`);
    next(error);
  }
};
