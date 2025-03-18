/**
 * Controlador para gerenciar mensagens do WebSocket
 * Responsável por receber requisições e delegar ao serviço apropriado
 */

const messageService = require('../services/messageService');
const { logger } = require('../utils/logger');

class MessageController {
  /**
   * Processa uma mensagem recebida via WebSocket
   * @param {Object} data - Dados da mensagem
   * @param {string} userId - ID do usuário remetente
   * @param {Object} ws - Conexão WebSocket
   * @param {Function} broadcast - Função para broadcast
   * @returns {Promise<void>} - Completa quando a mensagem for processada
   */
  async handleMessage(data, userId, ws, broadcast) {
    try {
      logger.debug(`Processing message from user ${userId}: ${JSON.stringify(data)}`);
      
      // Delegar o processamento ao serviço
      const result = await messageService.processMessage(data, userId, (message) => {
        // Função de callback para notificações
        switch (data.channel) {
          case 'vox':
          case 'couriers':
          case 'support':
            // Broadcast para canal específico
            broadcast(data.channel, message);
            break;
          default:
            // Mensagem direta ou outro tipo
            if (message.recipient) {
              // Enviar apenas para o destinatário
              broadcast(null, message, message.recipient);
            } else {
              // Fallback para broadcast global
              broadcast('default', message);
            }
        }
      });

      // Verificar resultado e executar ações apropriadas
      if (result.success) {
        switch (result.action) {
          case 'broadcast':
            // O broadcast já foi feito pelo callback
            break;
          case 'typing_notification':
            broadcast(data.channel, {
              type: 'typing',
              userId: userId,
              channel: data.channel,
              isTyping: true
            });
            break;
          case 'read_receipt':
            // Notificar que as mensagens foram lidas
            if (data.sender) {
              broadcast(null, {
                type: 'read_receipt',
                recipient: userId,
                sender: data.sender,
                timestamp: new Date()
              }, data.sender);
            }
            break;
          default:
            // Nenhuma ação necessária
            break;
        }
      } else {
        // Em caso de erro, notificar apenas o remetente
        ws.send(JSON.stringify({
          type: 'error',
          error: result.error
        }));
      }
    } catch (error) {
      logger.error('Error in message controller:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Internal server error processing message'
      }));
    }
  }

  /**
   * Configura um Change Stream para um canal específico
   * @param {string} channel - Canal para monitorar
   * @param {Function} notifyCallback - Função para notificar clientes
   * @returns {Promise<Object>} - Stream configurado
   */
  async setupChannelStream(channel, notifyCallback) {
    try {
      return await messageService.setupChangeStream(channel, notifyCallback);
    } catch (error) {
      logger.error(`Controller error setting up channel stream for ${channel}:`, error);
      throw new Error(`Failed to setup channel stream: ${error.message}`);
    }
  }

  /**
   * Busca histórico de mensagens para um canal
   * @param {string} channel - Nome do canal
   * @param {number} limit - Limite de mensagens
   * @returns {Promise<Array>} - Histórico de mensagens
   */
  async getChannelHistory(channel, limit = 50) {
    try {
      return await messageService.getChannelHistory(channel, limit);
    } catch (error) {
      logger.error(`Controller error getting channel history for ${channel}:`, error);
      throw new Error(`Failed to get channel history: ${error.message}`);
    }
  }

  /**
   * Busca mensagens diretas entre dois usuários
   * @param {string} sender - ID do remetente
   * @param {string} recipient - ID do destinatário
   * @param {number} limit - Limite de mensagens
   * @returns {Promise<Array>} - Mensagens diretas
   */
  async getDirectMessages(sender, recipient, limit = 50) {
    try {
      return await messageService.getDirectMessages(sender, recipient, limit);
    } catch (error) {
      logger.error(`Controller error getting direct messages between ${sender} and ${recipient}:`, error);
      throw new Error(`Failed to get direct messages: ${error.message}`);
    }
  }

  /**
   * Fecha um Change Stream específico
   * @param {string} channel - Canal do stream a ser fechado
   */
  closeChannelStream(channel) {
    try {
      messageService.closeChangeStream(channel);
    } catch (error) {
      logger.error(`Controller error closing channel stream for ${channel}:`, error);
    }
  }

  /**
   * Fecha todos os Change Streams ativos
   */
  closeAllStreams() {
    try {
      messageService.closeAllChangeStreams();
    } catch (error) {
      logger.error('Controller error closing all streams:', error);
    }
  }

  /**
   * Retorna lista de Change Streams ativos
   * @returns {Array} - Lista de streams ativos
   */
  getActiveStreams() {
    try {
      return messageService.getActiveChangeStreams();
    } catch (error) {
      logger.error('Controller error getting active streams:', error);
      return [];
    }
  }
}

// Exportar instância singleton
const messageController = new MessageController();
module.exports = messageController;
