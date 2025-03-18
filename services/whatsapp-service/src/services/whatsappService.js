/**
 * Serviço principal do WhatsApp para o AgentOS
 * Gerencia clientes WhatsApp e fornece interfaces para interagir com eles
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const { logger } = require('../utils/logger');
const websocketService = require('./websocketService');
const clientRepository = require('../repositories/clientRepository');
const messageRepository = require('../repositories/messageRepository');
const BaileysClient = require('../adapters/baileysAdapter');
const WebJsClient = require('../adapters/webjsAdapter');

class WhatsAppService extends EventEmitter {
  constructor() {
    super();
    
    this.baileyClients = new Map();
    this.webjsClients = new Map();
    
    // Garantir que diretórios necessários existam
    this.ensureDirectoriesExist();
  }

  /**
   * Inicializa o serviço WhatsApp
   */
  async initialize() {
    logger.info('Inicializando serviço WhatsApp');
    
    try {
      // Carrega clientes existentes do banco de dados
      const clients = await clientRepository.getAllClients();
      
      for (const client of clients) {
        // Inicializa apenas clientes marcados como autoConnectEnabled
        if (client.autoConnectEnabled) {
          await this.initializeClient(client.id);
        }
      }
      
      logger.info(`Serviço WhatsApp inicializado com ${this.baileyClients.size} clientes Baileys e ${this.webjsClients.size} clientes Web.js`);
      return true;
    } catch (error) {
      logger.error(`Erro ao inicializar serviço WhatsApp: ${error.message}`);
      throw error;
    }
  }

  /**
   * Garante que diretórios necessários existam
   */
  ensureDirectoriesExist() {
    const sessionsDir = config.whatsapp.sessionsDir;
    const mediaDir = config.whatsapp.mediaDir;
    
    if (!fs.existsSync(sessionsDir)) {
      logger.info(`Criando diretório de sessões: ${sessionsDir}`);
      fs.mkdirSync(sessionsDir, { recursive: true });
    }
    
    if (!fs.existsSync(mediaDir)) {
      logger.info(`Criando diretório de mídia: ${mediaDir}`);
      fs.mkdirSync(mediaDir, { recursive: true });
    }
  }

  /**
   * Inicializa um cliente WhatsApp pelo ID
   * @param {string} clientId - ID do cliente
   * @returns {Object} Cliente inicializado
   */
  async initializeClient(clientId) {
    logger.info(`Inicializando cliente WhatsApp: ${clientId}`);
    
    try {
      // Busca informações do cliente
      const clientData = await clientRepository.getClientById(clientId);
      
      if (!clientData) {
        throw new Error(`Cliente ${clientId} não encontrado`);
      }
      
      // Verifica se o cliente já está inicializado
      if (this.hasClient(clientId)) {
        logger.info(`Cliente ${clientId} já está inicializado`);
        return this.getClient(clientId);
      }
      
      let client;
      
      // Inicializa com base no tipo
      if (clientData.type === 'webjs') {
        client = await this.createWebJsClient(clientId, clientData);
      } else if (clientData.type === 'bailey') {
        client = await this.createBaileyClient(clientId, clientData);
      } else {
        throw new Error(`Tipo de cliente desconhecido: ${clientData.type}`);
      }
      
      // Configura listeners de eventos
      this.setupClientEventHandlers(client, clientId);
      
      // Atualiza status no banco de dados
      await clientRepository.updateClientStatus(clientId, 'initializing');
      
      return client;
    } catch (error) {
      logger.error(`Falha ao inicializar cliente ${clientId}: ${error.message}`);
      // Atualiza status de erro no banco de dados
      await clientRepository.updateClientStatus(clientId, 'error', { error: error.message });
      throw error;
    }
  }

  /**
   * Cria um cliente Web.js para mensagens diretas
   * @param {string} clientId - ID do cliente
   * @param {Object} options - Opções do cliente
   * @returns {Object} Cliente Web.js
   */
  async createWebJsClient(clientId, options = {}) {
    if (this.webjsClients.has(clientId)) {
      return this.webjsClients.get(clientId);
    }
    
    try {
      const client = new WebJsClient({
        clientId,
        sessionsDir: config.whatsapp.sessionsDir,
        headless: config.whatsapp.headless,
        ...options
      });
      
      // Inicializa o cliente
      await client.initialize();
      
      // Armazena o cliente
      this.webjsClients.set(clientId, client);
      
      logger.info(`Cliente Web.js ${clientId} criado e inicializado`);
      return client;
    } catch (error) {
      logger.error(`Erro ao criar cliente Web.js ${clientId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cria um cliente Baileys para grupos
   * @param {string} clientId - ID do cliente
   * @param {Object} options - Opções do cliente
   * @returns {Object} Cliente Baileys
   */
  async createBaileyClient(clientId, options = {}) {
    if (this.baileyClients.has(clientId)) {
      return this.baileyClients.get(clientId);
    }
    
    try {
      const client = new BaileysClient({
        clientId,
        sessionsDir: config.whatsapp.sessionsDir,
        ...options
      });
      
      // Inicializa o cliente
      await client.initialize();
      
      // Armazena o cliente
      this.baileyClients.set(clientId, client);
      
      logger.info(`Cliente Baileys ${clientId} criado e inicializado`);
      return client;
    } catch (error) {
      logger.error(`Erro ao criar cliente Baileys ${clientId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Configura manipuladores de eventos para o cliente
   * @param {Object} client - Cliente WhatsApp
   * @param {string} clientId - ID do cliente
   */
  setupClientEventHandlers(client, clientId) {
    // QR Code gerado
    client.on('qr', (qrCode) => {
      logger.info(`QR Code gerado para cliente ${clientId}`);
      
      // Atualiza QR Code no banco de dados
      clientRepository.updateClientQR(clientId, qrCode);
      
      // Notifica via WebSocket
      websocketService.broadcastToClient(clientId, {
        type: 'whatsapp_qr',
        clientId,
        qrCode,
        timestamp: new Date().toISOString()
      });
      
      // Propaga evento
      this.emit('qr', { clientId, qrCode });
    });
    
    // Cliente autenticado
    client.on('authenticated', () => {
      logger.info(`Cliente ${clientId} autenticado`);
      
      // Atualiza status no banco de dados
      clientRepository.updateClientStatus(clientId, 'authenticated');
      
      // Notifica via WebSocket
      websocketService.broadcastToClient(clientId, {
        type: 'whatsapp_status',
        clientId,
        status: 'authenticated',
        timestamp: new Date().toISOString()
      });
      
      // Propaga evento
      this.emit('authenticated', { clientId });
    });
    
    // Cliente pronto
    client.on('ready', () => {
      logger.info(`Cliente ${clientId} pronto`);
      
      // Atualiza status no banco de dados
      clientRepository.updateClientStatus(clientId, 'ready');
      
      // Notifica via WebSocket
      websocketService.broadcastToClient(clientId, {
        type: 'whatsapp_status',
        clientId,
        status: 'ready',
        timestamp: new Date().toISOString()
      });
      
      // Propaga evento
      this.emit('ready', { clientId });
    });
    
    // Mensagem recebida
    client.on('message', async (message) => {
      logger.debug(`Mensagem recebida para cliente ${clientId}: ${JSON.stringify(message)}`);
      
      try {
        // Salva mensagem no banco de dados
        const savedMessage = await messageRepository.saveMessage({
          clientId,
          messageId: message.id,
          chatId: message.chatId,
          fromMe: message.fromMe,
          sender: message.sender,
          body: message.body,
          timestamp: message.timestamp || new Date(),
          hasMedia: message.hasMedia || false,
          mediaType: message.mediaType,
          mediaUrl: message.mediaUrl,
          metadata: message.metadata
        });
        
        // Notifica via WebSocket
        websocketService.broadcastToClient(clientId, {
          type: 'whatsapp_message',
          clientId,
          message: savedMessage,
          timestamp: new Date().toISOString()
        });
        
        // Propaga evento
        this.emit('message', { clientId, message: savedMessage });
      } catch (error) {
        logger.error(`Erro ao processar mensagem para cliente ${clientId}: ${error.message}`);
      }
    });
    
    // Desconexão
    client.on('disconnected', (reason) => {
      logger.info(`Cliente ${clientId} desconectado: ${reason}`);
      
      // Atualiza status no banco de dados
      clientRepository.updateClientStatus(clientId, 'disconnected', { reason });
      
      // Notifica via WebSocket
      websocketService.broadcastToClient(clientId, {
        type: 'whatsapp_status',
        clientId,
        status: 'disconnected',
        reason,
        timestamp: new Date().toISOString()
      });
      
      // Propaga evento
      this.emit('disconnected', { clientId, reason });
      
      // Remove cliente das coleções
      this.removeClient(clientId);
    });
  }

  /**
   * Verifica se um cliente existe
   * @param {string} clientId - ID do cliente
   * @returns {boolean} Se o cliente existe
   */
  hasClient(clientId) {
    return this.baileyClients.has(clientId) || this.webjsClients.has(clientId);
  }

  /**
   * Obtém um cliente pelo ID
   * @param {string} clientId - ID do cliente
   * @returns {Object|null} Cliente WhatsApp
   */
  getClient(clientId) {
    return this.baileyClients.get(clientId) || this.webjsClients.get(clientId) || null;
  }

  /**
   * Remove um cliente
   * @param {string} clientId - ID do cliente
   */
  removeClient(clientId) {
    if (this.baileyClients.has(clientId)) {
      this.baileyClients.delete(clientId);
    }
    
    if (this.webjsClients.has(clientId)) {
      this.webjsClients.delete(clientId);
    }
  }

  /**
   * Obtém todos os clientes WhatsApp ativos
   * @returns {Array} Lista de clientes
   */
  getAllClients() {
    const clients = [];
    
    // Adiciona clientes Baileys
    for (const [id, client] of this.baileyClients.entries()) {
      clients.push({
        id,
        type: 'bailey',
        isReady: client.isReady(),
        phoneNumber: client.getPhoneNumber(),
        name: client.getName() || id
      });
    }
    
    // Adiciona clientes Web.js
    for (const [id, client] of this.webjsClients.entries()) {
      clients.push({
        id,
        type: 'webjs',
        isReady: client.isReady(),
        phoneNumber: client.getPhoneNumber(),
        name: client.getName() || id
      });
    }
    
    return clients;
  }

  /**
   * Gera um novo QR Code para um cliente
   * @param {string} clientId - ID do cliente
   * @returns {Promise<string>} QR Code gerado
   */
  async generateQR(clientId) {
    logger.info(`Gerando QR Code para cliente ${clientId}`);
    
    const client = this.getClient(clientId);
    
    if (!client) {
      throw new Error(`Cliente ${clientId} não encontrado`);
    }
    
    try {
      return await client.generateQR();
    } catch (error) {
      logger.error(`Erro ao gerar QR Code para ${clientId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envia uma mensagem de texto
   * @param {string} clientId - ID do cliente
   * @param {string} recipient - Destinatário
   * @param {string} text - Texto da mensagem
   * @returns {Promise<Object>} Mensagem enviada
   */
  async sendTextMessage(clientId, recipient, text) {
    logger.info(`Enviando mensagem para ${recipient} via cliente ${clientId}`);
    
    const client = this.getClient(clientId);
    
    if (!client) {
      throw new Error(`Cliente ${clientId} não encontrado`);
    }
    
    if (!client.isReady()) {
      throw new Error(`Cliente ${clientId} não está pronto`);
    }
    
    try {
      const message = await client.sendText(recipient, text);
      
      // Salva mensagem enviada no banco de dados
      const savedMessage = await messageRepository.saveMessage({
        clientId,
        messageId: message.id,
        chatId: message.chatId || recipient,
        fromMe: true,
        sender: client.getPhoneNumber(),
        recipient,
        body: text,
        timestamp: message.timestamp || new Date(),
        metadata: message.metadata
      });
      
      return savedMessage;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem para ${recipient}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envia uma mensagem de mídia
   * @param {string} clientId - ID do cliente
   * @param {string} recipient - Destinatário
   * @param {Object} media - Informações da mídia
   * @returns {Promise<Object>} Mensagem enviada
   */
  async sendMediaMessage(clientId, recipient, media) {
    logger.info(`Enviando mídia para ${recipient} via cliente ${clientId}`);
    
    const client = this.getClient(clientId);
    
    if (!client) {
      throw new Error(`Cliente ${clientId} não encontrado`);
    }
    
    if (!client.isReady()) {
      throw new Error(`Cliente ${clientId} não está pronto`);
    }
    
    try {
      const message = await client.sendMedia(recipient, media);
      
      // Salva mensagem enviada no banco de dados
      const savedMessage = await messageRepository.saveMessage({
        clientId,
        messageId: message.id,
        chatId: message.chatId || recipient,
        fromMe: true,
        sender: client.getPhoneNumber(),
        recipient,
        body: media.caption || '',
        timestamp: message.timestamp || new Date(),
        hasMedia: true,
        mediaType: media.type,
        mediaUrl: media.data,
        metadata: message.metadata
      });
      
      return savedMessage;
    } catch (error) {
      logger.error(`Erro ao enviar mídia para ${recipient}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém histórico de conversa
   * @param {string} clientId - ID do cliente
   * @param {string} chatId - ID do chat
   * @param {Object} options - Opções de paginação
   * @returns {Promise<Array>} Mensagens da conversa
   */
  async getConversationHistory(clientId, chatId, options = {}) {
    logger.info(`Buscando histórico para chat ${chatId} do cliente ${clientId}`);
    
    try {
      return await messageRepository.getConversationHistory(clientId, chatId, options);
    } catch (error) {
      logger.error(`Erro ao buscar histórico para ${chatId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marca mensagens como lidas
   * @param {string} clientId - ID do cliente
   * @param {string} chatId - ID do chat
   * @returns {Promise<number>} Número de mensagens atualizadas
   */
  async markMessagesAsRead(clientId, chatId) {
    logger.info(`Marcando mensagens como lidas para chat ${chatId} do cliente ${clientId}`);
    
    const client = this.getClient(clientId);
    
    if (!client) {
      throw new Error(`Cliente ${clientId} não encontrado`);
    }
    
    try {
      // Marca mensagens no cliente WhatsApp
      await client.markChatAsRead(chatId);
      
      // Marca mensagens no banco de dados
      const count = await messageRepository.markMessagesAsRead(clientId, chatId);
      
      return count;
    } catch (error) {
      logger.error(`Erro ao marcar mensagens como lidas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desconecta todos os clientes e encerra o serviço
   */
  async shutdown() {
    logger.info('Encerrando serviço WhatsApp');
    
    const baileyShutdowns = Array.from(this.baileyClients.entries()).map(
      async ([id, client]) => {
        try {
          await client.logout();
          logger.info(`Cliente Baileys ${id} desconectado`);
        } catch (error) {
          logger.error(`Erro ao desconectar cliente Baileys ${id}: ${error.message}`);
        }
      }
    );
    
    const webjsShutdowns = Array.from(this.webjsClients.entries()).map(
      async ([id, client]) => {
        try {
          await client.logout();
          logger.info(`Cliente Web.js ${id} desconectado`);
        } catch (error) {
          logger.error(`Erro ao desconectar cliente Web.js ${id}: ${error.message}`);
        }
      }
    );
    
    // Aguarda desconexão de todos os clientes
    await Promise.allSettled([...baileyShutdowns, ...webjsShutdowns]);
    
    // Limpa coleções
    this.baileyClients.clear();
    this.webjsClients.clear();
    
    logger.info('Serviço WhatsApp encerrado');
  }
}

module.exports = new WhatsAppService();
