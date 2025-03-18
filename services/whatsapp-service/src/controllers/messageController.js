/**
 * Controlador para operações relacionadas às mensagens WhatsApp
 */

const { logger } = require('../utils/logger');
const messageRepository = require('../repositories/messageRepository');
const clientRepository = require('../repositories/clientRepository');
const whatsappService = require('../services/whatsappService');
const websocketService = require('../services/websocketService');
const { NotFoundError, ValidationError, ServiceError } = require('../utils/errors');

class MessageController {
  /**
   * Obtém mensagens com filtros
   */
  async getMessages(req, res) {
    try {
      const { 
        clientId, 
        chatId, 
        sender,
        fromMe,
        search,
        hasMedia,
        startDate,
        endDate,
        limit = 50, 
        skip = 0, 
        sort = '-timestamp' 
      } = req.query;
      
      // Constrói filtros
      const filter = {};
      
      if (clientId) filter.clientId = clientId;
      if (chatId) filter.chatId = chatId;
      if (sender) filter.sender = sender;
      if (fromMe === 'true') filter.fromMe = true;
      if (fromMe === 'false') filter.fromMe = false;
      if (hasMedia === 'true') filter.hasMedia = true;
      if (hasMedia === 'false') filter.hasMedia = false;
      
      // Filtro por data
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }
      
      // Busca por texto
      if (search) {
        filter.$or = [
          { body: { $regex: search, $options: 'i' } },
          { senderName: { $regex: search, $options: 'i' } }
        ];
      }
      
      const messages = await messageRepository.findAll({
        filter,
        limit: parseInt(limit, 10),
        skip: parseInt(skip, 10),
        sort,
      });
      
      // Conta total para paginação
      const total = await messageRepository.count(filter);
      
      res.json({
        data: messages,
        pagination: {
          total,
          limit: parseInt(limit, 10),
          skip: parseInt(skip, 10),
          hasMore: total > (parseInt(skip, 10) + parseInt(limit, 10)),
        },
      });
    } catch (error) {
      logger.error(`Erro ao buscar mensagens: ${error.message}`);
      res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
  }
  
  /**
   * Obtém uma mensagem pelo ID
   */
  async getMessageById(req, res) {
    try {
      const { id } = req.params;
      
      const message = await messageRepository.findById(id);
      
      if (!message) {
        throw new NotFoundError(`Mensagem com ID ${id} não encontrada`);
      }
      
      res.json(message);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      
      logger.error(`Erro ao buscar mensagem: ${error.message}`);
      res.status(500).json({ error: 'Erro ao buscar mensagem' });
    }
  }
  
  /**
   * Envia uma nova mensagem
   */
  async sendMessage(req, res) {
    try {
      const { clientId, recipient, message, type = 'text', options = {} } = req.body;
      
      if (!clientId || !recipient || !message) {
        throw new ValidationError('Cliente, destinatário e mensagem são obrigatórios');
      }
      
      // Verifica se cliente existe
      const client = await clientRepository.findById(clientId);
      
      if (!client) {
        throw new NotFoundError(`Cliente com ID ${clientId} não encontrado`);
      }
      
      // Envia mensagem
      const result = await whatsappService.sendMessage(clientId, {
        recipient,
        message,
        type,
        options,
      });
      
      res.json(result);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      
      if (error instanceof ServiceError) {
        return res.status(400).json({ error: error.message });
      }
      
      logger.error(`Erro ao enviar mensagem: ${error.message}`);
      res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
  }
  
  /**
   * Obtém mensagens de um chat específico
   */
  async getMessagesByChat(req, res) {
    try {
      const { chatId } = req.params;
      const { clientId, limit = 50, skip = 0, sort = '-timestamp' } = req.query;
      
      // Constrói filtros
      const filter = { chatId };
      
      if (clientId) filter.clientId = clientId;
      
      const messages = await messageRepository.findAll({
        filter,
        limit: parseInt(limit, 10),
        skip: parseInt(skip, 10),
        sort,
      });
      
      // Conta total para paginação
      const total = await messageRepository.count(filter);
      
      res.json({
        data: messages,
        pagination: {
          total,
          limit: parseInt(limit, 10),
          skip: parseInt(skip, 10),
          hasMore: total > (parseInt(skip, 10) + parseInt(limit, 10)),
        },
      });
    } catch (error) {
      logger.error(`Erro ao buscar mensagens do chat: ${error.message}`);
      res.status(500).json({ error: 'Erro ao buscar mensagens do chat' });
    }
  }
  
  /**
   * Exclui uma mensagem
   */
  async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      
      // Verifica se mensagem existe
      const message = await messageRepository.findById(id);
      
      if (!message) {
        throw new NotFoundError(`Mensagem com ID ${id} não encontrada`);
      }
      
      // Remove do banco de dados
      await messageRepository.deleteById(id);
      
      // Notifica via WebSocket
      websocketService.broadcastToAll('message:deleted', {
        messageId: id,
        clientId: message.clientId,
        chatId: message.chatId,
      });
      
      res.json({ success: true, message: 'Mensagem removida com sucesso' });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      
      logger.error(`Erro ao remover mensagem: ${error.message}`);
      res.status(500).json({ error: 'Erro ao remover mensagem' });
    }
  }
  
  /**
   * Marca uma mensagem como lida
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      
      // Verifica se mensagem existe
      const message = await messageRepository.findById(id);
      
      if (!message) {
        throw new NotFoundError(`Mensagem com ID ${id} não encontrada`);
      }
      
      // Já está marcada como lida?
      if (message.read) {
        return res.json({ success: true, message: 'Mensagem já estava marcada como lida' });
      }
      
      // Marca mensagem como lida
      const updatedMessage = await messageRepository.updateById(id, {
        read: true,
        readAt: new Date(),
      });
      
      // Tenta marcar chat como lido no cliente WhatsApp
      try {
        await whatsappService.markChatAsRead(message.clientId, message.chatId);
      } catch (error) {
        logger.warn(`Não foi possível marcar chat como lido no WhatsApp: ${error.message}`);
        // Continua mesmo com erro, já que marcamos como lido no banco
      }
      
      // Notifica via WebSocket
      websocketService.broadcastToAll('message:read', {
        messageId: id,
        clientId: message.clientId,
        chatId: message.chatId,
      });
      
      res.json({ 
        success: true, 
        message: 'Mensagem marcada como lida com sucesso',
        data: updatedMessage,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      
      logger.error(`Erro ao marcar mensagem como lida: ${error.message}`);
      res.status(500).json({ error: 'Erro ao marcar mensagem como lida' });
    }
  }
  
  /**
   * Obtém mensagens não lidas
   */
  async getUnreadMessages(req, res) {
    try {
      const { clientId, limit = 50, skip = 0 } = req.query;
      
      // Constrói filtros
      const filter = { read: false };
      
      if (clientId) filter.clientId = clientId;
      
      const messages = await messageRepository.findAll({
        filter,
        limit: parseInt(limit, 10),
        skip: parseInt(skip, 10),
        sort: '-timestamp',
      });
      
      // Conta total para paginação
      const total = await messageRepository.count(filter);
      
      res.json({
        data: messages,
        pagination: {
          total,
          limit: parseInt(limit, 10),
          skip: parseInt(skip, 10),
          hasMore: total > (parseInt(skip, 10) + parseInt(limit, 10)),
        },
      });
    } catch (error) {
      logger.error(`Erro ao buscar mensagens não lidas: ${error.message}`);
      res.status(500).json({ error: 'Erro ao buscar mensagens não lidas' });
    }
  }
}

module.exports = MessageController;
