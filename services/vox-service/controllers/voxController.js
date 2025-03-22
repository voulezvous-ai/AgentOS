/**
 * Vox Controller
 * Handles the business logic for text and voice command processing
 */

const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../../common/config/logger');
const { AppError } = require('../../../common/utils/errorHandler');
const openaiHelper = require('../utils/openaiHelper');
const memoryManager = require('../utils/memoryManager');
const voxCore = require('../utils/voxCore');
const voxAudit = require('../utils/voxAudit');
const { createAuditMiddleware } = require('../../../common/middleware/auditMiddleware');

/**
 * Process text commands with intelligent action handling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.processTextCommand = async (req, res, next) => {
  try {
    const { query, userId, sessionId = uuidv4() } = req.body;
    const requestId = req.auditId || uuidv4(); // Usar ID de auditoria da requisição se disponível
    
    if (!query || !userId) {
      throw new AppError('Missing query or userId', 400, 'INVALID_REQUEST');
    }
    
    logger.info(`Processing text command for user ${userId}: ${query}`);
    
    // Iniciar timer de performance para medir latência da API
    const apiTimerId = voxAudit.startTimer(`API_TEXT_COMMAND`, {
      userId,
      sessionId,
      requestId
    });
    
    // Process the query through Vox Core
    const result = await voxCore.processQuery({
      query,
      userId,
      sessionId
    });
    
    // Finalizar timer e calcular latência
    const apiTime = voxAudit.endTimer(apiTimerId, { 
      success: true,
      intent: result.intent 
    });
    
    logger.info(`Processed command for user ${userId} with intent: ${result.intent}`);
    
    res.json({
      ...result,
      apiTime, // Incluir tempo de resposta para fins de telemetria
      sessionId
    });
  } catch (error) {
    // Se houver erro, registrar no sistema de auditoria
    if (req.auditId) {
      voxAudit.logger.error(`Error processing text command: ${error.message}`, {
        userId: req.body?.userId,
        sessionId: req.body?.sessionId,
        requestId: req.auditId,
        error: error.message,
        stack: error.stack
      });
    }
    
    logger.error(`Error processing text command: ${error.message}`);
    next(error);
  }
};

/**
 * Process voice commands with intelligent action handling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.processVoiceCommand = async (req, res, next) => {
  try {
    const { userId, sessionId = uuidv4() } = req.body;
    const requestId = req.auditId || uuidv4(); // Usar ID de auditoria da requisição se disponível
    
    if (!req.file || !userId) {
      throw new AppError('Missing audio file or userId', 400, 'INVALID_REQUEST');
    }
    
    logger.info(`Processing voice command for user ${userId}`);
    
    // Iniciar timer de performance para medir latência da API
    const apiTimerId = voxAudit.startTimer(`API_VOICE_COMMAND`, {
      userId,
      sessionId,
      requestId,
      fileSize: req.file.size
    });
    
    // Iniciar timer para medição da transcrição
    const transcriptionTimerId = voxAudit.startTimer('AUDIO_TRANSCRIPTION', {
      userId,
      sessionId,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });
    
    // Transcribe audio using OpenAI Whisper API
    const transcription = await openaiHelper.transcribeAudio(
      fs.createReadStream(req.file.path),
      { model: 'whisper-1' }
    );
    
    // Finalizar timer de transcrição
    const transcriptionTime = voxAudit.endTimer(transcriptionTimerId);
    
    // Registrar uso da API de IA no sistema de auditoria
    voxAudit.logAIRequest('OpenAI', 'whisper-1', { audioFile: req.file.originalname }, transcriptionTime, {
      userId,
      sessionId
    });
    
    logger.info(`Transcription for user ${userId}: ${transcription}`);
    
    // Registrar comando de voz no sistema de auditoria
    voxAudit.logCommandReceived(userId, 'voice', transcription, {
      sessionId,
      requestId,
      source: 'api'
    });
    
    // Process the transcribed query through Vox Core
    const result = await voxCore.processQuery({
      query: transcription,
      userId,
      sessionId
    });
    
    // Clean up temporary file
    fs.unlink(req.file.path, err => {
      if (err) logger.error(`Error deleting uploaded file: ${err.message}`);
    });
    
    // Finalizar timer e calcular latência
    const apiTime = voxAudit.endTimer(apiTimerId, { 
      success: true,
      intent: result.intent,
      transcriptionTime
    });
    
    logger.info(`Processed voice command for user ${userId} with intent: ${result.intent}`);
    
    res.json({
      ...result,
      transcription,
      apiTime, // Incluir tempo de resposta para fins de telemetria
      sessionId
    });
  } catch (error) {
    // Se houver erro, registrar no sistema de auditoria
    if (req.auditId) {
      voxAudit.logger.error(`Error processing voice command: ${error.message}`, {
        userId: req.body?.userId,
        sessionId: req.body?.sessionId,
        requestId: req.auditId,
        error: error.message,
        stack: error.stack
      });
    }
    
    logger.error(`Error processing voice command: ${error.message}`);
    
    // Clean up temporary file if it exists
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, err => {
        if (err) logger.error(`Error deleting uploaded file: ${err.message}`);
      });
    }
    
    next(error);
  }
};

/**
 * Check status of an escalated action
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.checkEscalationStatus = async (req, res, next) => {
  try {
    const { escalationId } = req.params;
    const requestId = req.auditId || uuidv4(); // Usar ID de auditoria da requisição se disponível
    
    if (!escalationId) {
      throw new AppError('Missing escalationId', 400, 'INVALID_REQUEST');
    }
    
    logger.info(`Checking escalation status for ${escalationId}`);
    
    // Iniciar timer de performance para medir latência da API
    const apiTimerId = voxAudit.startTimer(`API_CHECK_ESCALATION`, {
      escalationId,
      requestId
    });
    
    const status = await voxCore.checkEscalationStatus(escalationId);
    
    // Finalizar timer e calcular latência
    const apiTime = voxAudit.endTimer(apiTimerId, { 
      success: true, 
      status: status.status 
    });
    
    res.json({
      ...status,
      apiTime // Incluir tempo de resposta para fins de telemetria
    });
  } catch (error) {
    // Se houver erro, registrar no sistema de auditoria
    if (req.auditId) {
      voxAudit.logger.error(`Error checking escalation status: ${error.message}`, {
        escalationId: req.params?.escalationId,
        requestId: req.auditId,
        error: error.message,
        stack: error.stack
      });
    }
    
    logger.error(`Error checking escalation status: ${error.message}`);
    next(error);
  }
};

/**
 * Get recent conversation history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getConversationHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    const requestId = req.auditId || uuidv4(); // Usar ID de auditoria da requisição se disponível
    
    if (!userId) {
      throw new AppError('Missing userId', 400, 'INVALID_REQUEST');
    }
    
    logger.info(`Fetching conversation history for user ${userId}`);
    
    // Iniciar timer de performance para medir latência da API
    const apiTimerId = voxAudit.startTimer(`API_GET_HISTORY`, {
      userId,
      requestId,
      limit
    });
    
    const history = await memoryManager.searchMemories(null, userId, parseInt(limit));
    
    // Finalizar timer e calcular latência
    const apiTime = voxAudit.endTimer(apiTimerId, { 
      success: true, 
      count: history.length || 0
    });
    
    // Registrar acesso ao histórico no sistema de auditoria
    voxAudit.logger.info(`Conversation history accessed`, {
      userId,
      requestId,
      count: history.length || 0,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      userId,
      history: history.map(item => ({
        id: item._id,
        prompt: item.content.prompt,
        response: item.content.response,
        timestamp: item.metadata.timestamp,
        source: item.metadata.source,
        intent: item.metadata.context?.intent || 'unknown'
      })),
      apiTime // Incluir tempo de resposta para fins de telemetria
    });
  } catch (error) {
    // Se houver erro, registrar no sistema de auditoria
    if (req.auditId) {
      voxAudit.logger.error(`Error fetching conversation history: ${error.message}`, {
        userId: req.params?.userId,
        requestId: req.auditId,
        error: error.message,
        stack: error.stack
      });
    }
    
    logger.error(`Error fetching conversation history: ${error.message}`);
    next(error);
  }
};

/**
 * Delete user conversation history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteConversationHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requestId = req.auditId || uuidv4(); // Usar ID de auditoria da requisição se disponível
    
    if (!userId) {
      throw new AppError('Missing userId', 400, 'INVALID_REQUEST');
    }
    
    logger.info(`Deleting conversation history for user ${userId}`);
    
    // Iniciar timer de performance para medir latência da API
    const apiTimerId = voxAudit.startTimer(`API_DELETE_HISTORY`, {
      userId,
      requestId
    });
    
    // Operação fictícia de exclusão de memórias - implementar conforme a lógica real do sistema
    await memoryManager.deleteMemoriesByUser(userId);
    
    // Finalizar timer e calcular latência
    const apiTime = voxAudit.endTimer(apiTimerId, { success: true });
    
    // Registrar exclusão de histórico no sistema de auditoria
    voxAudit.logger.audit(userId, 'user_data_deletion', {
      type: 'conversation_history',
      requestId,
      timestamp: new Date(),
      reason: 'user_requested'
    }, 'security');
    
    res.json({
      success: true,
      message: 'Conversation history deleted successfully',
      userId,
      apiTime // Incluir tempo de resposta para fins de telemetria
    });
  } catch (error) {
    // Se houver erro, registrar no sistema de auditoria
    if (req.auditId) {
      voxAudit.logger.error(`Error deleting conversation history: ${error.message}`, {
        userId: req.params?.userId,
        requestId: req.auditId,
        error: error.message,
        stack: error.stack
      });
    }
    
    logger.error(`Error deleting conversation history: ${error.message}`);
    next(error);
  }
};
