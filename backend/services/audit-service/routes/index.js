/**
 * Rotas do Serviço de Auditoria
 * Define todos os endpoints para visualização e gestão de logs de auditoria
 */

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authMiddleware = require('../../../common/middleware/authMiddleware');

/**
 * @route   GET /api/audit/health
 * @desc    Verificação de saúde do serviço
 * @access  Público
 */
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'audit-service' });
});

/**
 * @route   GET /api/audit/logs
 * @desc    Obter logs de auditoria com filtros
 * @access  Privado (Admin, Security)
 */
router.get('/logs', authMiddleware(['admin', 'security']), auditController.getLogs);

/**
 * @route   GET /api/audit/logs/:auditId
 * @desc    Obter detalhes de um log específico
 * @access  Privado (Admin, Security)
 */
router.get('/logs/:auditId', authMiddleware(['admin', 'security']), auditController.getLogById);

/**
 * @route   GET /api/audit/stats
 * @desc    Obter estatísticas de logs de auditoria
 * @access  Privado (Admin, Security)
 */
router.get('/stats', authMiddleware(['admin', 'security']), auditController.getAuditStats);

/**
 * @route   GET /api/audit/user/:userId
 * @desc    Obter logs de auditoria de um usuário específico
 * @access  Privado (Admin, Security, Self)
 */
router.get('/user/:userId', authMiddleware(), auditController.getUserActivityLogs);

/**
 * @route   GET /api/audit/search
 * @desc    Pesquisar logs de auditoria
 * @access  Privado (Admin, Security)
 */
router.get('/search', authMiddleware(['admin', 'security']), auditController.searchLogs);

/**
 * @route   GET /api/audit/export
 * @desc    Exportar logs de auditoria
 * @access  Privado (Admin, Security)
 */
router.get('/export', authMiddleware(['admin', 'security']), auditController.exportLogs);

/**
 * @route   POST /api/audit/logs
 * @desc    Criar manualmente um log de auditoria
 * @access  Privado (Admin, Security, Serviços Internos)
 */
router.post('/logs', authMiddleware(['admin', 'security', 'service']), auditController.createManualLog);

module.exports = router;
