/**
 * Repositório para operações com clientes WhatsApp
 */

const Client = require('../models/Client');
const { logger } = require('../utils/logger');

class ClientRepository {
  /**
   * Cria um novo cliente
   * @param {Object} clientData - Dados do cliente
   * @returns {Promise<Object>} Cliente criado
   */
  async createClient(clientData) {
    try {
      const client = new Client(clientData);
      await client.save();
      logger.info(`Cliente criado: ${client.id}`);
      return client;
    } catch (error) {
      logger.error(`Erro ao criar cliente: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Obtém um cliente pelo ID
   * @param {string} clientId - ID do cliente
   * @returns {Promise<Object|null>} Cliente encontrado ou null
   */
  async getClientById(clientId) {
    try {
      return await Client.findOne({ id: clientId });
    } catch (error) {
      logger.error(`Erro ao buscar cliente ${clientId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Obtém todos os clientes
   * @param {Object} filter - Filtros opcionais
   * @returns {Promise<Array>} Lista de clientes
   */
  async getAllClients(filter = {}) {
    try {
      return await Client.find(filter).sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Erro ao listar clientes: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Atualiza um cliente
   * @param {string} clientId - ID do cliente
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object|null>} Cliente atualizado ou null
   */
  async updateClient(clientId, updateData) {
    try {
      const client = await Client.findOne({ id: clientId });
      
      if (!client) {
        logger.warn(`Cliente não encontrado para atualização: ${clientId}`);
        return null;
      }
      
      Object.assign(client, updateData);
      client.lastActivity = new Date();
      
      await client.save();
      logger.info(`Cliente atualizado: ${clientId}`);
      
      return client;
    } catch (error) {
      logger.error(`Erro ao atualizar cliente ${clientId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Atualiza o status de um cliente
   * @param {string} clientId - ID do cliente
   * @param {string} status - Novo status
   * @param {Object} details - Detalhes adicionais
   * @returns {Promise<Object|null>} Cliente atualizado ou null
   */
  async updateClientStatus(clientId, status, details = {}) {
    try {
      const client = await Client.findOne({ id: clientId });
      
      if (!client) {
        logger.warn(`Cliente não encontrado para atualização de status: ${clientId}`);
        return null;
      }
      
      await client.updateStatus(status, details);
      logger.info(`Status do cliente ${clientId} atualizado para: ${status}`);
      
      return client;
    } catch (error) {
      logger.error(`Erro ao atualizar status do cliente ${clientId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Atualiza o QR Code de um cliente
   * @param {string} clientId - ID do cliente
   * @param {string} qrCode - QR Code
   * @returns {Promise<Object|null>} Cliente atualizado ou null
   */
  async updateClientQR(clientId, qrCode) {
    try {
      const client = await Client.findOne({ id: clientId });
      
      if (!client) {
        logger.warn(`Cliente não encontrado para atualização de QR: ${clientId}`);
        return null;
      }
      
      await client.updateQR(qrCode);
      logger.info(`QR Code do cliente ${clientId} atualizado`);
      
      return client;
    } catch (error) {
      logger.error(`Erro ao atualizar QR Code do cliente ${clientId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Remove um cliente
   * @param {string} clientId - ID do cliente
   * @returns {Promise<boolean>} Se o cliente foi removido
   */
  async removeClient(clientId) {
    try {
      const result = await Client.deleteOne({ id: clientId });
      
      if (result.deletedCount === 0) {
        logger.warn(`Cliente não encontrado para remoção: ${clientId}`);
        return false;
      }
      
      logger.info(`Cliente removido: ${clientId}`);
      return true;
    } catch (error) {
      logger.error(`Erro ao remover cliente ${clientId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Busca clientes por status
   * @param {string} status - Status a buscar
   * @returns {Promise<Array>} Lista de clientes
   */
  async getClientsByStatus(status) {
    try {
      return await Client.find({ status }).sort({ lastActivity: -1 });
    } catch (error) {
      logger.error(`Erro ao buscar clientes por status ${status}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Busca clientes por tipo
   * @param {string} type - Tipo de cliente (webjs ou bailey)
   * @returns {Promise<Array>} Lista de clientes
   */
  async getClientsByType(type) {
    try {
      return await Client.find({ type }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Erro ao buscar clientes do tipo ${type}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ClientRepository();
