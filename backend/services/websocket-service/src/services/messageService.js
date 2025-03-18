/**
 * Serviço para gerenciamento de mensagens
 * Implementa a lógica de negócios relacionada a mensagens
 * Seguindo o padrão de separação de responsabilidades
 */

const MessageRepository = require('../repositories/messageRepository');
const { logger } = require('../utils/logger');

class MessageService {
  constructor() {
    this.repository = new MessageRepository();
    this.changeStreams = {};
  }

  /**
   * Salva uma mensagem no banco de dados
   * @param {Object} messageData - Dados da mensagem
   * @returns {Promise<Object>} - Mensagem salva
   */
  async saveMessage(messageData) {
    try {
      return await this.repository.create(messageData);
    } catch (error) {
      logger.error('Error saving message:', error);
      throw new Error('Failed to save message');
    }
  }

  /**
   * Busca histórico de mensagens para um canal específico
   * @param {string} channel - Nome do canal
   * @param {number} limit - Número máximo de mensagens para retornar
   * @param {number} skip - Número de mensagens para pular (paginação)
   * @returns {Promise<Array>} - Lista de mensagens
   */
  async getChannelHistory(channel, limit = 50, skip = 0) {
    try {
      return await this.repository.getConversationHistory(channel, limit, skip);
    } catch (error) {
      logger.error('Error fetching channel history:', error);
      throw new Error('Failed to fetch channel history');
    }
  }

  /**
   * Busca mensagens diretas entre dois usuários
   * @param {string} sender - ID do remetente
   * @param {string} recipient - ID do destinatário
   * @param {number} limit - Número máximo de mensagens para retornar
   * @param {number} skip - Número de mensagens para pular (paginação)
   * @returns {Promise<Array>} - Lista de mensagens
   */
  async getDirectMessages(sender, recipient, limit = 50, skip = 0) {
    try {
      return await this.repository.getDirectMessages(sender, recipient, limit, skip);
    } catch (error) {
      logger.error('Error fetching direct messages:', error);
      throw new Error('Failed to fetch direct messages');
    }
  }

  /**
   * Marca mensagens como lidas
   * @param {string} recipient - ID do destinatário
   * @param {string} sender - ID do remetente (opcional)
   * @returns {Promise<Object>} - Resultado da operação
   */
  async markMessagesAsRead(recipient, sender = null) {
    try {
      return await this.repository.markAsRead(recipient, sender);
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Busca mensagens não lidas para um destinatário
   * @param {string} recipient - ID do destinatário
   * @returns {Promise<Array>} - Lista de mensagens não lidas
   */
  async getUnreadMessages(recipient) {
    try {
      return await this.repository.getUnreadMessages(recipient);
    } catch (error) {
      logger.error('Error fetching unread messages:', error);
      throw new Error('Failed to fetch unread messages');
    }
  }

  /**
   * Processa uma mensagem recebida via WebSocket
   * @param {Object} data - Dados da mensagem
   * @param {string} userId - ID do usuário remetente
   * @param {Function} notifyCallback - Função para notificar clientes
   * @returns {Promise<Object>} - Resultado do processamento
   */
  async processMessage(data, userId, notifyCallback) {
    try {
      // Verificar tipo de mensagem e realizar ações específicas
      switch (data.type) {
        case 'chat':
          // Processar mensagem de chat normal
          const messageData = {
            channel: data.channel || 'default',
            sender: userId,
            senderName: data.senderName,
            senderType: data.senderType || 'user',
            recipient: data.recipient,
            content: data.content,
            contentType: data.contentType || 'text',
            metadata: data.metadata || {}
          };
          
          const savedMessage = await this.saveMessage(messageData);
          
          // Retornar mensagem processada
          return {
            success: true,
            message: savedMessage,
            action: 'broadcast'
          };
          
        case 'typing':
          // Notificar que usuário está digitando (não persiste no banco)
          return {
            success: true,
            action: 'typing_notification',
            data: {
              userId,
              channel: data.channel,
              isTyping: true
            }
          };
          
        case 'read_receipt':
          // Marcar mensagens como lidas
          await this.markMessagesAsRead(userId, data.sender);
          return {
            success: true,
            action: 'read_receipt',
            data: {
              userId,
              sender: data.sender
            }
          };
          
        default:
          return {
            success: false,
            error: 'Unknown message type',
            action: 'none'
          };
      }
    } catch (error) {
      logger.error('Error processing message:', error);
      return {
        success: false,
        error: error.message,
        action: 'error'
      };
    }
  }

  /**
   * Configura um Change Stream para monitorar alterações em mensagens
   * @param {string} channel - Canal para monitorar
   * @param {Function} notifyCallback - Função para notificar clientes
   * @returns {Object} - Stream configurado
   */
  async setupChangeStream(channel, notifyCallback) {
    try {
      // Verificar se já existe um stream para este canal
      if (this.changeStreams[channel]) {
        logger.info(`Reusing existing change stream for channel: ${channel}`);
        return this.changeStreams[channel];
      }

      logger.info(`Setting up change stream for channel: ${channel}`);
      
      // Criar um novo change stream
      const changeStream = await this.repository.createChangeStream(
        channel,
        (change) => {
          // Processar mudanças e notificar clientes
          if (change.operationType === 'insert') {
            const message = change.fullDocument;
            notifyCallback(message);
          }
        }
      );

      // Configurar error handler
      changeStream.on('error', (error) => {
        logger.error(`Error in change stream for channel ${channel}:`, error);
        // Tentar reconectar após um tempo
        setTimeout(() => {
          this.closeChangeStream(channel);
          this.setupChangeStream(channel, notifyCallback);
        }, 5000);
      });

      // Armazenar referência ao stream
      this.changeStreams[channel] = {
        stream: changeStream,
        isClosed: () => changeStream.closed,
        close: () => changeStream.close()
      };

      return this.changeStreams[channel];
    } catch (error) {
      logger.error(`Failed to set up change stream for channel ${channel}:`, error);
      throw new Error(`Failed to setup change stream: ${error.message}`);
    }
  }

  /**
   * Fecha um Change Stream específico
   * @param {string} channel - Canal do stream a ser fechado
   */
  closeChangeStream(channel) {
    try {
      if (this.changeStreams[channel]) {
        logger.info(`Closing change stream for channel: ${channel}`);
        this.changeStreams[channel].close();
        delete this.changeStreams[channel];
      }
    } catch (error) {
      logger.error(`Error closing change stream for channel ${channel}:`, error);
    }
  }

  /**
   * Fecha todos os Change Streams ativos
   */
  closeAllChangeStreams() {
    try {
      const channels = Object.keys(this.changeStreams);
      logger.info(`Closing all ${channels.length} active change streams`);
      
      for (const channel of channels) {
        this.closeChangeStream(channel);
      }
      
      logger.info('All change streams closed successfully');
    } catch (error) {
      logger.error('Error closing all change streams:', error);
      throw new Error('Failed to close all change streams');
    }
  }

  /**
   * Retorna lista de Change Streams ativos
   * @returns {Array} - Lista de streams ativos
   */
  getActiveChangeStreams() {
    return Object.keys(this.changeStreams).map(channel => ({
      channel,
      isClosed: this.changeStreams[channel].isClosed()
    }));
  }
}

// Criando uma instância singleton
const messageService = new MessageService();

module.exports = messageService;
