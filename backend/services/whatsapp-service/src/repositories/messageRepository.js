/**
 * Repositório para operações com mensagens WhatsApp
 */

const Message = require('../models/Message');
const { logger } = require('../utils/logger');

class MessageRepository {
  /**
   * Salva uma nova mensagem
   * @param {Object} messageData - Dados da mensagem
   * @returns {Promise<Object>} Mensagem salva
   */
  async saveMessage(messageData) {
    try {
      // Verifica se a mensagem já existe
      const existingMessage = await Message.findOne({
        clientId: messageData.clientId,
        messageId: messageData.messageId
      });
      
      if (existingMessage) {
        logger.debug(`Mensagem ${messageData.messageId} já existe, atualizando...`);
        
        // Atualiza mensagem existente
        Object.assign(existingMessage, messageData);
        await existingMessage.save();
        
        return existingMessage;
      }
      
      // Cria nova mensagem
      const message = new Message(messageData);
      await message.save();
      
      logger.debug(`Mensagem ${message.messageId} salva`);
      return message;
    } catch (error) {
      logger.error(`Erro ao salvar mensagem: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Obtém uma mensagem pelo ID
   * @param {string} clientId - ID do cliente
   * @param {string} messageId - ID da mensagem
   * @returns {Promise<Object|null>} Mensagem encontrada ou null
   */
  async getMessageById(clientId, messageId) {
    try {
      return await Message.findOne({ clientId, messageId });
    } catch (error) {
      logger.error(`Erro ao buscar mensagem ${messageId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Obtém histórico de conversa
   * @param {string} clientId - ID do cliente
   * @param {string} chatId - ID do chat
   * @param {Object} options - Opções de paginação
   * @returns {Promise<Object>} Mensagens e informações de paginação
   */
  async getConversationHistory(clientId, chatId, options = {}) {
    try {
      return await Message.getConversationHistory(clientId, chatId, options);
    } catch (error) {
      logger.error(`Erro ao buscar histórico de conversa: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Marca mensagens como lidas
   * @param {string} clientId - ID do cliente
   * @param {string} chatId - ID do chat
   * @param {Object} options - Opções adicionais
   * @returns {Promise<number>} Número de mensagens atualizadas
   */
  async markMessagesAsRead(clientId, chatId, options = {}) {
    try {
      return await Message.markChatAsRead(clientId, chatId, options);
    } catch (error) {
      logger.error(`Erro ao marcar mensagens como lidas: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Busca mensagens por texto
   * @param {string} clientId - ID do cliente
   * @param {string} searchText - Texto a buscar
   * @param {Object} options - Opções de paginação
   * @returns {Promise<Object>} Mensagens e informações de paginação
   */
  async searchMessages(clientId, searchText, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      
      const query = {
        clientId,
        body: { $regex: searchText, $options: 'i' }
      };
      
      const messages = await Message.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      
      const total = await Message.countDocuments(query);
      
      return {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Erro ao buscar mensagens por texto: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Obtém estatísticas de mensagens
   * @param {string} clientId - ID do cliente
   * @returns {Promise<Object>} Estatísticas
   */
  async getMessageStats(clientId) {
    try {
      const totalMessages = await Message.countDocuments({ clientId });
      const sentMessages = await Message.countDocuments({ clientId, fromMe: true });
      const receivedMessages = await Message.countDocuments({ clientId, fromMe: false });
      const mediaMessages = await Message.countDocuments({ clientId, hasMedia: true });
      
      // Mensagens agrupadas por dia nas últimas 2 semanas
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const messagesByDay = await Message.aggregate([
        {
          $match: {
            clientId,
            timestamp: { $gte: twoWeeksAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            count: { $sum: 1 },
            sent: {
              $sum: { $cond: [{ $eq: ['$fromMe', true] }, 1, 0] }
            },
            received: {
              $sum: { $cond: [{ $eq: ['$fromMe', false] }, 1, 0] }
            }
          }
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
            '_id.day': 1
          }
        }
      ]);
      
      // Converte para formato mais amigável
      const dailyStats = messagesByDay.map(day => ({
        date: new Date(day._id.year, day._id.month - 1, day._id.day).toISOString().split('T')[0],
        total: day.count,
        sent: day.sent,
        received: day.received
      }));
      
      return {
        total: totalMessages,
        sent: sentMessages,
        received: receivedMessages,
        media: mediaMessages,
        dailyStats
      };
    } catch (error) {
      logger.error(`Erro ao buscar estatísticas de mensagens: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Remove mensagens antigas
   * @param {number} olderThanDays - Remover mensagens mais antigas que X dias
   * @returns {Promise<number>} Número de mensagens removidas
   */
  async pruneOldMessages(olderThanDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const result = await Message.deleteMany({
        timestamp: { $lt: cutoffDate }
      });
      
      logger.info(`${result.deletedCount} mensagens antigas removidas`);
      return result.deletedCount;
    } catch (error) {
      logger.error(`Erro ao remover mensagens antigas: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new MessageRepository();
