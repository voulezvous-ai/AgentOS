/**
 * Adaptador para o cliente whatsapp-web.js
 * Especializado em mensagens diretas
 */

const EventEmitter = require('events');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');
const config = require('../config/config');

class WebJsAdapter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.clientId = options.clientId || `webjs_${Date.now()}`;
    this.sessionsDir = options.sessionsDir || config.whatsapp.sessionsDir;
    this.headless = options.headless !== undefined ? options.headless : config.whatsapp.headless;
    
    this.client = null;
    this.authenticated = false;
    this.ready = false;
    this.qrCode = null;
    
    // Opções padrão com as fornecidas
    this.options = {
      puppeteer: {
        headless: this.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
      },
      ...options,
    };
  }
  
  /**
   * Inicializa o cliente
   */
  async initialize() {
    try {
      logger.info(`Inicializando cliente WebJs: ${this.clientId}`);
      
      // Cria cliente com autenticação local (session)
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: this.clientId,
          dataPath: this.sessionsDir,
        }),
        puppeteer: this.options.puppeteer,
      });
      
      // Configura handlers de eventos
      this.setupEventHandlers();
      
      // Inicializa o cliente
      await this.client.initialize();
      
      return this;
    } catch (error) {
      logger.error(`Erro ao inicializar cliente WebJs ${this.clientId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Configura handlers de eventos
   */
  setupEventHandlers() {
    // QR Code recebido
    this.client.on('qr', (qr) => {
      this.qrCode = qr;
      logger.info(`QR Code recebido para cliente ${this.clientId}`);
      this.emit('qr', qr);
    });
    
    // Autenticado com sucesso
    this.client.on('authenticated', () => {
      this.authenticated = true;
      logger.info(`Cliente ${this.clientId} autenticado`);
      this.emit('authenticated');
    });
    
    // Falha na autenticação
    this.client.on('auth_failure', (msg) => {
      this.authenticated = false;
      this.ready = false;
      logger.error(`Falha na autenticação do cliente ${this.clientId}: ${msg}`);
      this.emit('auth_failure', msg);
    });
    
    // Cliente pronto
    this.client.on('ready', () => {
      this.ready = true;
      logger.info(`Cliente ${this.clientId} pronto`);
      this.emit('ready');
    });
    
    // Mensagem recebida
    this.client.on('message', async (msg) => {
      try {
        // Formata a mensagem para o padrão comum
        const formattedMessage = await this.formatMessage(msg);
        this.emit('message', formattedMessage);
      } catch (error) {
        logger.error(`Erro ao processar mensagem: ${error.message}`);
      }
    });
    
    // Desconexão
    this.client.on('disconnected', (reason) => {
      this.authenticated = false;
      this.ready = false;
      logger.info(`Cliente ${this.clientId} desconectado: ${reason}`);
      this.emit('disconnected', reason);
    });
  }
  
  /**
   * Formata uma mensagem para um formato padronizado
   * @param {Object} msg - Mensagem do whatsapp-web.js
   * @returns {Object} Mensagem formatada
   */
  async formatMessage(msg) {
    try {
      const chat = await msg.getChat();
      const contact = await msg.getContact();
      
      let hasMedia = false;
      let mediaType = null;
      let mediaUrl = null;
      
      // Verifica se tem mídia e baixa se necessário
      if (msg.hasMedia) {
        hasMedia = true;
        
        // Determina o tipo de mídia
        if (msg.type === 'image') mediaType = 'image';
        else if (msg.type === 'video') mediaType = 'video';
        else if (msg.type === 'audio' || msg.type === 'ptt') mediaType = 'audio';
        else if (msg.type === 'document') mediaType = 'document';
        
        // Se o cache de mídia estiver ativado, baixa a mídia
        if (config.whatsapp.mediaCacheEnabled) {
          try {
            // Baixa e salva a mídia
            const media = await msg.downloadMedia();
            if (media) {
              const mediaDir = path.join(config.whatsapp.mediaDir, this.clientId);
              
              // Garante que o diretório exista
              if (!fs.existsSync(mediaDir)) {
                fs.mkdirSync(mediaDir, { recursive: true });
              }
              
              // Gera nome de arquivo baseado no ID da mensagem
              const extension = this.getExtensionFromMimeType(media.mimetype);
              const filename = `${msg.id.id}.${extension}`;
              const filePath = path.join(mediaDir, filename);
              
              // Salva mídia como arquivo
              fs.writeFileSync(filePath, Buffer.from(media.data, 'base64'));
              
              // Define URL local relativa
              mediaUrl = `media/${this.clientId}/${filename}`;
            }
          } catch (mediaError) {
            logger.error(`Erro ao baixar mídia: ${mediaError.message}`);
          }
        }
      }
      
      // Formata a mensagem para o padrão comum
      return {
        id: msg.id.id,
        clientId: this.clientId,
        chatId: chat.id._serialized,
        fromMe: msg.fromMe,
        sender: msg.fromMe ? this.getPhoneNumber() : msg._data.author || msg._data.from,
        senderName: msg.fromMe ? 'You' : (contact.name || contact.pushname || ''),
        body: msg.body,
        hasMedia,
        mediaType,
        mediaUrl,
        timestamp: msg.timestamp ? new Date(msg.timestamp * 1000) : new Date(),
        metadata: {
          messageType: msg.type,
          isGroup: chat.isGroup,
          chatName: chat.name,
          isForwarded: msg._data.isForwarded,
        },
      };
    } catch (error) {
      logger.error(`Erro ao formatar mensagem: ${error.message}`);
      
      // Retorna formato básico em caso de erro
      return {
        id: msg.id.id,
        clientId: this.clientId,
        chatId: msg._data.from,
        fromMe: msg.fromMe,
        body: msg.body,
        timestamp: new Date(),
      };
    }
  }
  
  /**
   * Obtém extensão de arquivo a partir do MIME type
   * @param {string} mimeType - MIME type
   * @returns {string} Extensão
   */
  getExtensionFromMimeType(mimeType) {
    const mimeToExt = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    };
    
    return mimeToExt[mimeType] || 'bin';
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
    if (this.client) {
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
    if (!this.client || !this.authenticated) {
      return null;
    }
    
    try {
      const info = this.client.info;
      return info ? info.wid.user : null;
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
    if (!this.client || !this.authenticated) {
      return null;
    }
    
    try {
      const info = this.client.info;
      return info ? (info.pushname || null) : null;
    } catch (error) {
      logger.error(`Erro ao obter nome: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Envia mensagem de texto
   * @param {string} recipient - Destinatário (formato: 553198765432)
   * @param {string} text - Texto da mensagem
   * @returns {Promise<Object>} Mensagem enviada
   */
  async sendText(recipient, text) {
    if (!this.isReady()) {
      throw new Error('Cliente não está pronto');
    }
    
    try {
      // Formata o número para o formato esperado pelo whatsapp-web.js
      const formattedNumber = `${recipient}@c.us`;
      
      // Envia a mensagem
      const result = await this.client.sendMessage(formattedNumber, text);
      
      // Formata resposta
      return {
        id: result.id.id,
        chatId: formattedNumber,
        fromMe: true,
        timestamp: new Date(),
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
      // Formata o número para o formato esperado pelo whatsapp-web.js
      const formattedNumber = `${recipient}@c.us`;
      
      // Cria objeto de mídia
      let mediaObj;
      
      // Verifica o formato da mídia
      if (media.data.startsWith('http')) {
        // URL - baixa a mídia
        mediaObj = await MessageMedia.fromUrl(media.data);
      } else if (fs.existsSync(media.data)) {
        // Caminho de arquivo local
        mediaObj = MessageMedia.fromFilePath(media.data);
      } else if (media.data.startsWith('data:') || /^[A-Za-z0-9+/=]+$/.test(media.data)) {
        // Data URL ou string base64
        const mimetype = media.mimetype || this.getMimeTypeFromBase64(media.data);
        const filename = media.filename || 'file';
        mediaObj = new MessageMedia(mimetype, media.data.replace(/^data:.*?;base64,/, ''), filename);
      } else {
        throw new Error('Formato de mídia não suportado');
      }
      
      // Envia a mídia
      const result = await this.client.sendMessage(formattedNumber, mediaObj, {
        caption: media.caption || '',
        sendMediaAsDocument: media.type === 'document',
      });
      
      // Formata resposta
      return {
        id: result.id.id,
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
   * Tenta determinar o MIME type de uma string base64
   * @param {string} base64 - String em base64
   * @returns {string} MIME type
   */
  getMimeTypeFromBase64(base64) {
    const signatures = {
      '/9j/': 'image/jpeg',
      'iVBORw0KGg': 'image/png',
      'R0lGOD': 'image/gif',
      'UklGR': 'image/webp',
      'JVBERi0': 'application/pdf',
      'AAABAA': 'image/x-icon',
      'PD94': 'image/svg+xml',
      'Qk0': 'image/bmp',
      'SUQz': 'audio/mpeg',
      'T2dnU': 'audio/ogg',
      'AAAAGGZ0': 'video/mp4',
    };
    
    const cleanBase64 = base64.replace(/^data:.*?;base64,/, '');
    
    for (const [signature, mimeType] of Object.entries(signatures)) {
      if (atob(cleanBase64.substr(0, 10)).indexOf(signature) === 0) {
        return mimeType;
      }
    }
    
    return 'application/octet-stream';
  }
  
  /**
   * Marca chat como lido
   * @param {string} chatId - ID do chat
   * @returns {Promise<boolean>} Sucesso
   */
  async markChatAsRead(chatId) {
    if (!this.isReady()) {
      throw new Error('Cliente não está pronto');
    }
    
    try {
      const chat = await this.client.getChatById(chatId);
      await chat.sendSeen();
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
      if (this.client) {
        await this.client.destroy();
        this.client = null;
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

module.exports = WebJsAdapter;
