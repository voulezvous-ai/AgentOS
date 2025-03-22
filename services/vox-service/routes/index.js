/**
 * Vox Service Routes
 * Defines all endpoints for the Vox hybrid service
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const voxController = require('../controllers/voxController');

// Configure multer for voice uploads
const upload = multer({ 
  dest: path.join(__dirname, '../uploads/'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * @route   POST /api/vox/text
 * @desc    Process text commands
 * @access  Public
 */
router.post('/text', voxController.processTextCommand);

/**
 * @route   POST /api/vox/voice
 * @desc    Process voice commands (audio file upload)
 * @access  Public
 */
router.post('/voice', upload.single('audio'), voxController.processVoiceCommand);

/**
 * @route   GET /api/vox/escalation/:escalationId
 * @desc    Check status of an escalated action
 * @access  Public
 */
router.get('/escalation/:escalationId', voxController.checkEscalationStatus);

/**
 * @route   GET /api/vox/history/:userId
 * @desc    Get conversation history for a user
 * @access  Public
 */
router.get('/history/:userId', voxController.getConversationHistory);

/**
 * @route   GET /api/vox/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'vox-hybrid' });
});

/**
 * @route   GET /api/vox/docs
 * @desc    Documentation endpoint
 * @access  Public
 */
router.get('/docs', (req, res) => {
  res.status(200).json({
    service: 'Vox Service',
    version: '1.0.0',
    description: 'Vox é o assistente de inteligência artificial do AgentOS, capaz de processar comandos de texto e voz, executar ações empresariais e escalonar decisões quando necessário.',
    endpoints: [
      {
        path: '/health',
        method: 'GET',
        description: 'Verificar o status do serviço Vox'
      },
      {
        path: '/text',
        method: 'POST',
        description: 'Processar comando de texto',
        body: {
          query: 'Texto do comando',
          userId: 'ID do usuário',
          sessionId: 'ID da sessão (opcional)'
        }
      },
      {
        path: '/voice',
        method: 'POST',
        description: 'Processar comando de voz',
        body: {
          userId: 'ID do usuário',
          sessionId: 'ID da sessão (opcional)',
          audio: 'Arquivo de áudio (multipart/form-data)'
        }
      },
      {
        path: '/escalation/:escalationId',
        method: 'GET',
        description: 'Verificar status de uma ação escalonada'
      },
      {
        path: '/history/:userId',
        method: 'GET',
        description: 'Obter histórico de conversas de um usuário',
        query: {
          limit: 'Número máximo de interações a retornar (padrão: 10)'
        }
      }
    ]
  });
});

module.exports = router;
