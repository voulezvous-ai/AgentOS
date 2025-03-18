/**
 * Adaptador para o cliente Baileys WhatsApp
 * Especializado em gerenciar interações WhatsApp utilizando a biblioteca WhiskeySockets/Baileys
 * Versão atualizada para suportar recursos modernos do Baileys v6.7.16+
 */

const EventEmitter = require('events');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs');
const NodeCache = require('@cacheable/node-cache');
const { logger } = require('../utils/logger');
const config = require('../config/config');

class BaileysAdapter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.clientId = options.clientId || `bailey_${Date.now()}`;
    this.sessionsDir = options.sessionsDir || config.whatsapp.sessionsDir;
    this.clientSessionDir = path.join(this.sessionsDir, this.clientId);
    
    // Caches para otimizar performance conforme recomendações do Baileys
    this.msgRetryCounterCache = new NodeCache();
    this.contactsCache = new NodeCache();
    
    this.defaultOptions = {
      printQRInTerminal: false,
      auth: null,
      logger: logger.child({ module: `baileys:${this.clientId}` }),
      // Versão específica do navegador para evitar bloqueios
      browser: ['AgentOS', 'Chrome', '10.0'],
      // Ativa o armazenamento temporário para melhorar performance
      msgRetryCounterCache: this.msgRetryCounterCache,
      // Configura limites de mensagem para evitar bloqueios
      syncFullHistory: false,
      ...options,
    };
    
    this.socket = null;
    this.authenticated = false;
    this.ready = false;
    this.qrCode = null;
    this.versionInfo = null;
    
    // Garante que o diretório da sessão exista
    if (!fs.existsSync(this.clientSessionDir)) {
      fs.mkdirSync(this.clientSessionDir, { recursive: true });
    }
  }
  
  /**
   * Inicializa o cliente com a versão mais recente da API do Baileys
   * @returns {Promise<BaileysAdapter>} Instância do adaptador
   */
  async initialize() {
    try {
      logger.info(`Inicializando cliente Baileys: ${this.clientId}`);
      
      // Recupera a versão mais recente da API do WhatsApp
      this.versionInfo = await fetchLatestBaileysVersion();
      logger.info(`Usando versão do WhatsApp Web: ${this.versionInfo.version}`);
      
      // Carrega estado de autenticação
      const { state, saveCreds } = await useMultiFileAuthState(this.clientSessionDir);
      
      // Cria um armazenamento seguro de chaves para otimizar o desempenho
      const signalKeyStore = makeCacheableSignalKeyStore(state.keys, this.logger);
      
      // Cria socket com as configurações otimizadas
      this.socket = makeWASocket({
        ...this.defaultOptions,
        version: this.versionInfo.version,
        auth: {
          creds: state.creds,
          keys: signalKeyStore,
        },
        // Armazenamento em cache para evitar problemas de desempenho
        getMessage: async (key) => {
          // Implementação de recuperação de mensagem (opcional)
          // Esta função é necessária para responder mensagens e encaminhar mensagens
          // Pode ser implementada para buscar mensagens do banco de dados
          return { conversation: '' };
        },
        // Configurações adicionais para estabilidade
        defaultQueryTimeoutMs: 30000,
        connectTimeoutMs: 60000,
        transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 1000 },
        patchMessageBeforeSending: (message) => {
          // Função que pode ser usada para modificar mensagens antes do envio
          // Útil para adicionar metadados personalizados ou fazer ajustes
          // Especificamente em mensagens de texto
          return message;
        },
      });
      
      // Configuração para salvar credenciais automaticamente
      this.socket.ev.on('creds.update', saveCreds);
      
      // Configura handlers de eventos
      this.setupEventHandlers();
      
      return this;
    } catch (error) {
      logger.error(`Erro ao inicializar cliente Baileys ${this.clientId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Configura handlers de eventos
   */
  setupEventHandlers() {
    // Evento de conexão
    this.socket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        // QR Code recebido
        this.qrCode = qr;
        this.emit('qr', qr);
        logger.info(`QR Code recebido para cliente ${this.clientId}`);
      }
      
      if (connection === 'close') {
        // Análise refinada do erro para determinar se deve reconectar
        const statusCode = (lastDisconnect?.error instanceof Boom) ? lastDisconnect?.error?.output?.statusCode : undefined;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        logger.info(`Conexão fechada para cliente ${this.clientId}. Código: ${statusCode}. Reconexão: ${shouldReconnect}`);
        
        this.authenticated = false;
        this.ready = false;
        
        if (shouldReconnect) {
          this.emit('disconnected', 'connection closed, attempting reconnect');
          // Reconexão com atraso para evitar tentativas em loop rápido
          setTimeout(() => this.initialize(), 2000);
        } else {
          this.emit('disconnected', 'logged out, no reconnect');
        }
      } else if (connection === 'open') {
        // Conexão aberta
        this.authenticated = true;
        this.ready = true;
        
        this.emit('authenticated');
        this.emit('ready');
        
        logger.info(`Cliente ${this.clientId} conectado e pronto`);
      }
    });
    
    // Evento de novas mensagens
    this.socket.ev.on('messages.upsert', async ({ messages, type }) => {
      // Apenas processa mensagens novas, não notificações
      if (type !== 'notify') return;
      
      for (const message of messages) {
        // Ignora mensagens de status
        if (message.key.remoteJid === 'status@broadcast') continue;
        
        try {
          const formattedMessage = await this.formatMessage(message);
          if (formattedMessage) {
            this.emit('message', formattedMessage);
            
            // Marca como lida automaticamente se configurado
            if (config.whatsapp.autoReadMessages) {
              await this.socket.readMessages([message.key]);
            }
          }
        } catch (error) {
          logger.error(`Erro ao processar mensagem: ${error.message}`);
        }
      }
    });
    
    // Monitoramento de mudanças de estado em chats
    this.socket.ev.on('chats.update', (updates) => {
      for (const update of updates) {
        this.emit('chat.update', update);
      }
    });
    
    // Monitoramento de mudanças de estado nos contatos
    this.socket.ev.on('contacts.update', (updates) => {
      for (const update of updates) {
        this.emit('contact.update', update);
      }
    });
    
    // Evento de presença (online/offline/typing)
    this.socket.ev.on('presence.update', (update) => {
      this.emit('presence.update', update);
    });
  }
  
  /**
   * Formata uma mensagem recebida para um formato padronizado
   * @param {Object} rawMessage - Mensagem bruta do Baileys
   * @returns {Object} Mensagem formatada
   */
  async formatMessage(rawMessage) {
    const msg = rawMessage.message;
    if (!msg) return null;
    
    const messageType = Object.keys(msg)[0];
    const chatId = rawMessage.key.remoteJid;
    const fromMe = rawMessage.key.fromMe;
    const messageId = rawMessage.key.id;
    const pushName = rawMessage.pushName;
    
    let body = '';
    let hasMedia = false;
    let mediaType = null;
    let mediaUrl = null;
    
    // Extrai corpo da mensagem com base no tipo
    if (messageType === 'conversation') {
      body = msg.conversation;
    } else if (messageType === 'extendedTextMessage') {
      body = msg.extendedTextMessage.text;
    } else if (messageType === 'imageMessage') {
      body = msg.imageMessage.caption || '';
      hasMedia = true;
      mediaType = 'image';
      // A URL da mídia seria baixada e armazenada localmente
    } else if (messageType === 'videoMessage') {
      body = msg.videoMessage.caption || '';
      hasMedia = true;
      mediaType = 'video';
    } else if (messageType === 'audioMessage') {
      hasMedia = true;
      mediaType = 'audio';
    } else if (messageType === 'documentMessage') {
      body = msg.documentMessage.fileName || '';
      hasMedia = true;
      mediaType = 'document';
    }
    
    return {
      id: messageId,
      clientId: this.clientId,
      chatId,
      fromMe,
      sender: fromMe ? this.getPhoneNumber() : chatId.split('@')[0],
      senderName: fromMe ? 'You' : pushName,
      body,
      hasMedia,
      mediaType,
      mediaUrl,
      timestamp: new Date(rawMessage.messageTimestamp * 1000),
      metadata: {
        messageType,
        rawMessage: config.app.env === 'development' ? rawMessage : undefined,
      },
    };
  }
  
  /**
   * Verifica se o cliente está pronto
   * @returns {boolean}
   */
  isReady() {
    return this.ready;
  }
  
  /**
   * Gera um QR Code para autenticação
   * @returns {Promise<string>} QR Code
   */
  async generateQR() {
    if (this.authenticated) {
      throw new Error('Cliente já autenticado');
    }
    
    logger.info(`Gerando QR Code para cliente ${this.clientId}`);
    
    // Reinicializa o cliente para gerar novo QR
    if (this.socket) {
      await this.logout();
      await this.initialize();
    }
    
    // Espera até que o QR seja gerado
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Tempo esgotado ao aguardar QR Code'));
      }, 30000);
      
      this.once('qr', (qr) => {
        clearTimeout(timeout);
        resolve(qr);
      });
    });
  }
  
  /**
   * Obtém o número de telefone do cliente (próprio)
   * @returns {string|null}
   */
  getPhoneNumber() {
    if (!this.socket || !this.authenticated) {
      return null;
    }
    
    try {
      // No Baileys, o número próprio fica armazenado nos metadados da conexão
      const user = this.socket.user;
      return user ? user.id.split('@')[0] : null;
    } catch (error) {
      logger.error(`Erro ao obter número de telefone: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Obtém o nome configurado no WhatsApp
   * @returns {string|null}
   */
  getName() {
    if (!this.socket || !this.authenticated) {
      return null;
    }
    
    try {
      const user = this.socket.user;
      return user ? (user.name || user.verifiedName || null) : null;
    } catch (error) {
      logger.error(`Erro ao obter nome: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Envia mensagem de texto
   * @param {string} recipient - Destinatário (formato: 553198765432)
   * @param {string} text - Texto da mensagem
   * @param {Object} options - Opções adicionais (citação, botões, etc)
   * @returns {Promise<Object>} Mensagem enviada
   */
  async sendText(recipient, text, options = {}) {
    if (!this.isReady()) {
      throw new Error('Cliente não está pronto');
    }
    
    try {
      // Formata o número no padrão esperado pelo Baileys
      const formattedNumber = `${recipient}@s.whatsapp.net`;
      
      // Prepara a mensagem com opções avançadas
      const message = { text };
      
      // Adiciona citação se fornecida (responder mensagem)
      if (options.quotedMessageId) {
        message.quoted = {
          key: {
            remoteJid: formattedNumber,
            id: options.quotedMessageId,
          }
        };
      }
      
      // Envia a mensagem com possíveis opções adicionais
      const result = await this.socket.sendMessage(formattedNumber, message);
      
      // Formata resposta
      return {
        id: result.key.id,
        chatId: formattedNumber,
        fromMe: true,
        timestamp: new Date(),
        body: text,
        messageType: 'text',
      };
    } catch (error) {
      logger.error(`Erro ao enviar mensagem: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Envia mensagem de mídia
   * @param {string} recipient - Destinatário
   * @param {Object} media - Dados da mídia
   * @returns {Promise<Object>} Mensagem enviada
   */
  async sendMedia(recipient, media) {
    if (!this.isReady()) {
      throw new Error('Cliente não está pronto');
    }
    
    try {
      // Formata o número no padrão esperado pelo Baileys
      const formattedNumber = `${recipient}@s.whatsapp.net`;
      
      let result;
      
      // Envia conforme o tipo de mídia
      switch (media.type) {
        case 'image':
          result = await this.socket.sendMessage(formattedNumber, {
            image: media.data,
            caption: media.caption || '',
          });
          break;
          
        case 'video':
          result = await this.socket.sendMessage(formattedNumber, {
            video: media.data,
            caption: media.caption || '',
          });
          break;
          
        case 'audio':
          result = await this.socket.sendMessage(formattedNumber, {
            audio: media.data,
            mimetype: 'audio/mp4',
            ptt: media.asVoiceNote || false,
          });
          break;
          
        case 'document':
          result = await this.socket.sendMessage(formattedNumber, {
            document: media.data,
            mimetype: media.mimeType || 'application/octet-stream',
            fileName: media.filename || 'file',
          });
          break;
          
        default:
          throw new Error(`Tipo de mídia não suportado: ${media.type}`);
      }
      
      // Formata resposta
      return {
        id: result.key.id,
        chatId: formattedNumber,
        fromMe: true,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Erro ao enviar mídia: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Marca chat como lido
   * @param {string} chatId - ID do chat
   * @param {Array} messageIds - IDs das mensagens específicas (opcional)
   * @returns {Promise<boolean>} Sucesso
   */
  async markChatAsRead(chatId, messageIds = []) {
    if (!this.isReady()) {
      throw new Error('Cliente não está pronto');
    }
    
    try {
      if (messageIds.length > 0) {
        // Marca mensagens específicas como lidas
        const keys = messageIds.map(id => ({ remoteJid: chatId, id: id, fromMe: false }));
        await this.socket.readMessages(keys);
      } else {
        // Marca todas as mensagens do chat como lidas (método atualizado)
        await this.socket.chatModify({ markRead: true, lastMessages: [] }, chatId);
      }
      return true;
    } catch (error) {
      logger.error(`Erro ao marcar chat como lido: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Desconecta o cliente
   * @returns {Promise<boolean>} Sucesso
   */
  async logout() {
    try {
      if (this.socket) {
        await this.socket.logout();
        this.socket = null;
      }
      
      this.authenticated = false;
      this.ready = false;
      
      logger.info(`Cliente ${this.clientId} desconectado`);
      return true;
    } catch (error) {
      logger.error(`Erro ao desconectar cliente: ${error.message}`);
      return false;
    }
  }
}

module.exports = BaileysAdapter;
