/**
 * Repositório para mensagens
 * Responsável por todas as operações de banco de dados relacionadas a mensagens
 * Seguindo o padrão Repository para isolamento de operações de persistência
 */

const Message = require('../models/Message');
const { logger } = require('../utils/logger');

class MessageRepository {
  /**
   * Cria uma nova mensagem no banco de dados
   * @param {Object} messageData - Dados da mensagem
   * @returns {Promise<Object>} - Mensagem criada
   */
  async create(messageData) {
    try {
      const message = new Message({
        channel: messageData.channel || 'default',
        conversationId: messageData.conversationId,
        sender: messageData.sender,
        senderName: messageData.senderName,
        senderType: messageData.senderType || 'user',
        recipient: messageData.recipient,
        content: messageData.content,
        contentType: messageData.contentType || 'text',
        metadata: messageData.metadata || {}
      });

      await message.save();
      return message.toClientJSON();
    } catch (error) {
      logger.error('Repository error creating message:', error);
      throw new Error(`Failed to create message: ${error.message}`);
    }
  }

  /**
   * Busca um histórico de conversas para um canal específico
   * @param {string} channel - Nome do canal
   * @param {number} limit - Número máximo de mensagens para retornar
   * @param {number} skip - Número de mensagens para pular (paginação)
   * @returns {Promise<Array>} - Lista de mensagens
   */
  async getConversationHistory(channel, limit = 50, skip = 0) {
    try {
      const messages = await Message.getConversationHistory(channel, limit, skip);
      return messages.map(msg => msg.toClientJSON());
    } catch (error) {
      logger.error('Repository error fetching conversation history:', error);
      throw new Error(`Failed to fetch conversation history: ${error.message}`);
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
      const messages = await Message.getDirectMessages(sender, recipient, limit, skip);
      return messages.map(msg => msg.toClientJSON());
    } catch (error) {
      logger.error('Repository error fetching direct messages:', error);
      throw new Error(`Failed to fetch direct messages: ${error.message}`);
    }
  }

  /**
   * Marca mensagens como lidas
   * @param {string} recipient - ID do destinatário
   * @param {string} sender - ID do remetente (opcional)
   * @returns {Promise<Object>} - Resultado da operação
   */
  async markAsRead(recipient, sender = null) {
    try {
      return await Message.markAsRead(recipient, sender);
    } catch (error) {
      logger.error('Repository error marking messages as read:', error);
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  }

  /**
   * Busca mensagens não lidas para um destinatário
   * @param {string} recipient - ID do destinatário
   * @returns {Promise<Array>} - Lista de mensagens não lidas
   */
  async getUnreadMessages(recipient) {
    try {
      const messages = await Message.getUnreadMessages(recipient);
      return messages.map(msg => msg.toClientJSON());
    } catch (error) {
      logger.error('Repository error fetching unread messages:', error);
      throw new Error(`Failed to fetch unread messages: ${error.message}`);
    }
  }

  /**
   * Cria um change stream para monitorar alterações nas mensagens
   * @param {string} channel - Canal a ser monitorado
   * @param {Function} onChangeCallback - Callback para mudanças
   * @returns {Object} - Change stream criado
   */
  async createChangeStream(channel, onChangeCallback) {
    try {
      const pipeline = [
        {
          $match: {
            'operationType': { $in: ['insert', 'update', 'delete'] },
            'fullDocument.channel': channel
          }
        }
      ];

      // Criar change stream com pipeline para filtrar por canal
      const changeStream = Message.watch(pipeline, {
        fullDocument: 'updateLookup'
      });

      // Configurar event handlers
      changeStream.on('change', (change) => {
        onChangeCallback(change);
      });

      return changeStream;
    } catch (error) {
      logger.error('Repository error creating change stream:', error);
      throw new Error(`Failed to create change stream: ${error.message}`);
    }
  }
}

module.exports = MessageRepository;
