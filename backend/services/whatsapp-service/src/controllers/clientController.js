/**
 * Controlador para operações relacionadas aos clientes WhatsApp
 */

const { logger } = require('../utils/logger');
const clientRepository = require('../repositories/clientRepository');
const whatsappService = require('../services/whatsappService');
const websocketService = require('../services/websocketService');
const { NotFoundError, ValidationError, ServiceError } = require('../utils/errors');

class ClientController {
  /**
   * Obtém todos os clientes
   */
  async getAllClients(req, res) {
    try {
      const { limit = 50, skip = 0, sort = '-createdAt' } = req.query;
      
      const clients = await clientRepository.findAll({
        limit: parseInt(limit, 10),
        skip: parseInt(skip, 10),
        sort,
      });
      
      // Adiciona status atual dos clientes conectados
      const enrichedClients = clients.map(client => {
        const clientInstance = whatsappService.getClientInstance(client.id);
        
        // Adiciona status atual ao objeto
        return {
          ...client.toJSON(),
          connected: !!clientInstance,
          isReady: clientInstance?.isReady() || false,
        };
      });
      
      res.json(enrichedClients);
    } catch (error) {
      logger.error(`Erro ao buscar clientes: ${error.message}`);
      res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
  }
  
  /**
   * Obtém um cliente pelo ID
   */
  async getClientById(req, res) {
    try {
      const { id } = req.params;
      
      const client = await clientRepository.findById(id);
      
      if (!client) {
        throw new NotFoundError(`Cliente com ID ${id} não encontrado`);
      }
      
      // Adiciona status atual do cliente conectado
      const clientInstance = whatsappService.getClientInstance(id);
      const enrichedClient = {
        ...client.toJSON(),
        connected: !!clientInstance,
        isReady: clientInstance?.isReady() || false,
      };
      
      res.json(enrichedClient);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      
      logger.error(`Erro ao buscar cliente: ${error.message}`);
      res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  }
  
  /**
   * Cria um novo cliente
   */
  async createClient(req, res) {
    try {
      const { name, description, type = 'webjs', metadata = {} } = req.body;
      
      // Cria o cliente no banco de dados
      const newClient = await clientRepository.create({
        name,
        description,
        type,
        metadata,
        status: 'created',
        createdBy: req.user?.id || 'system',
      });
      
      // Resposta de sucesso
      res.status(201).json(newClient);
      
      // Notifica sobre novo cliente via WebSocket
      websocketService.broadcastToAll('client:created', {
        clientId: newClient.id,
        name: newClient.name,
        type: newClient.type,
      });
      
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Dados inválidos para criação do cliente',
          details: error.errors,
        });
      }
      
      logger.error(`Erro ao criar cliente: ${error.message}`);
      res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  }
  
  /**
   * Remove um cliente
   */
  async deleteClient(req, res) {
    try {
      const { id } = req.params;
      
      // Verifica se cliente existe
      const client = await clientRepository.findById(id);
      
      if (!client) {
        throw new NotFoundError(`Cliente com ID ${id} não encontrado`);
      }
      
      // Desconecta cliente se estiver conectado
      const clientInstance = whatsappService.getClientInstance(id);
      if (clientInstance) {
        await whatsappService.disconnectClient(id);
      }
      
      // Remove do banco de dados
      await clientRepository.deleteById(id);
      
      // Notifica via WebSocket
      websocketService.broadcastToAll('client:deleted', {
        clientId: id,
        name: client.name,
      });
      
      res.json({ success: true, message: 'Cliente removido com sucesso' });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      
      logger.error(`Erro ao remover cliente: ${error.message}`);
      res.status(500).json({ error: 'Erro ao remover cliente' });
    }
  }
  
  /**
   * Gera QR code para um cliente
   */
  async generateQR(req, res) {
    try {
      const { id } = req.params;
      
      // Verifica se cliente existe
      const client = await clientRepository.findById(id);
      
      if (!client) {
        throw new NotFoundError(`Cliente com ID ${id} não encontrado`);
      }
      
      // Gera QR code
      const qrCode = await whatsappService.generateQR(id);
      
      res.json({ clientId: id, qrCode });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      
      if (error instanceof ServiceError) {
        return res.status(400).json({ error: error.message });
      }
      
      logger.error(`Erro ao gerar QR code: ${error.message}`);
      res.status(500).json({ error: 'Erro ao gerar QR code' });
    }
  }
  
  /**
   * Desconecta um cliente
   */
  async logoutClient(req, res) {
    try {
      const { id } = req.params;
      
      // Verifica se cliente existe
      const client = await clientRepository.findById(id);
      
      if (!client) {
        throw new NotFoundError(`Cliente com ID ${id} não encontrado`);
      }
      
      // Desconecta cliente
      const result = await whatsappService.disconnectClient(id);
      
      if (!result) {
        throw new ServiceError('Falha ao desconectar cliente');
      }
      
      // Atualiza status no banco de dados
      await clientRepository.updateById(id, {
        status: 'disconnected',
        qrCode: null,
        lastDisconnectedAt: new Date(),
      });
      
      res.json({ success: true, message: 'Cliente desconectado com sucesso' });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      
      if (error instanceof ServiceError) {
        return res.status(400).json({ error: error.message });
      }
      
      logger.error(`Erro ao desconectar cliente: ${error.message}`);
      res.status(500).json({ error: 'Erro ao desconectar cliente' });
    }
  }
  
  /**
   * Obtém chats de um cliente
   */
  async getClientChats(req, res) {
    try {
      const { id } = req.params;
      const { limit = 50, skip = 0 } = req.query;
      
      // Verifica se cliente existe
      const client = await clientRepository.findById(id);
      
      if (!client) {
        throw new NotFoundError(`Cliente com ID ${id} não encontrado`);
      }
      
      // Obtém chats
      const chats = await whatsappService.getClientChats(id, {
        limit: parseInt(limit, 10),
        skip: parseInt(skip, 10),
      });
      
      res.json(chats);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      
      if (error instanceof ServiceError) {
        return res.status(400).json({ error: error.message });
      }
      
      logger.error(`Erro ao obter chats: ${error.message}`);
      res.status(500).json({ error: 'Erro ao obter chats do cliente' });
    }
  }
  
  /**
   * Envia mensagem através de um cliente
   */
  async sendMessage(req, res) {
    try {
      const { id } = req.params;
      const { recipient, message, type = 'text', options = {} } = req.body;
      
      if (!recipient || !message) {
        throw new ValidationError('Destinatário e mensagem são obrigatórios');
      }
      
      // Verifica se cliente existe
      const client = await clientRepository.findById(id);
      
      if (!client) {
        throw new NotFoundError(`Cliente com ID ${id} não encontrado`);
      }
      
      // Envia mensagem
      const result = await whatsappService.sendMessage(id, {
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
   * Obtém status de um cliente
   */
  async getClientStatus(req, res) {
    try {
      const { id } = req.params;
      
      // Verifica se cliente existe
      const client = await clientRepository.findById(id);
      
      if (!client) {
        throw new NotFoundError(`Cliente com ID ${id} não encontrado`);
      }
      
      // Obtém status
      const status = await whatsappService.getClientStatus(id);
      
      res.json(status);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      
      logger.error(`Erro ao obter status: ${error.message}`);
      res.status(500).json({ error: 'Erro ao obter status do cliente' });
    }
  }
}

module.exports = ClientController;
