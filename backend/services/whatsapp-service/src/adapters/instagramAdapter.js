/**
 * Adaptador para o Instagram Messenger
 * Utiliza a API do Instagram Graph para mensagens diretas
 */

const EventEmitter = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const FormData = require('form-data');
const { logger } = require('../utils/logger');
const config = require('../config/config');

class InstagramAdapter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.clientId = options.clientId || `instagram_${Date.now()}`;
    this.pageId = options.pageId;
    this.accessToken = options.accessToken;
    this.verifyToken = options.verifyToken || crypto.randomBytes(16).toString('hex');
    this.sessionsDir = options.sessionsDir || config.instagram.sessionsDir;
    this.mediaDir = path.join(config.instagram.mediaDir, this.clientId);
    
    this.authenticated = false;
    this.ready = false;
    this.webhookUrl = null;
    
    // Garante que os diretórios existam
    if (!fs.existsSync(this.mediaDir)) {
      fs.mkdirSync(this.mediaDir, { recursive: true });
    }
    
    // Configuração para o cliente HTTP
    this.apiVersion = options.apiVersion || 'v16.0';
    this.apiUrl = `https://graph.facebook.com/${this.apiVersion}`;
    
    // Informações do perfil do Instagram
    this.profile = null;
  }
  
  /**
   * Inicializa o cliente do Instagram
   */
  async initialize() {
    try {
      logger.info(`Inicializando cliente Instagram: ${this.clientId}`);
      
      if (!this.pageId || !this.accessToken) {
        throw new Error('pageId e accessToken são obrigatórios para o Instagram');
      }
      
      // Verifica se o token é válido
      await this.validateToken();
      
      // Recupera informações do perfil do Instagram
      await this.fetchProfile();
      
      // Ativa eventos
      this.authenticated = true;
      this.ready = true;
      
      this.emit('authenticated');
      this.emit('ready');
      
      logger.info(`Cliente Instagram ${this.clientId} inicializado e pronto`);
      
      // Configura verificação periódica de mensagens
      this.startMessagePolling();
      
      return this;
    } catch (error) {
      logger.error(`Erro ao inicializar cliente Instagram ${this.clientId}: ${error.message}`);
      this.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Valida o token de acesso
   */
  async validateToken() {
    try {
      const response = await axios.get(`${this.apiUrl}/debug_token`, {
        params: {
          input_token: this.accessToken,
          access_token: this.accessToken,
        },
      });
      
      const { data } = response.data;
      
      if (!data.is_valid) {
        throw new Error(`Token inválido: ${data.error.message}`);
      }
      
      const expiresAt = new Date(data.expires_at * 1000);
      logger.info(`Token do Instagram válido até ${expiresAt.toISOString()}`);
      
      return true;
    } catch (error) {
      logger.error(`Erro ao validar token: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Busca informações do perfil do Instagram
   */
  async fetchProfile() {
    try {
      const response = await axios.get(`${this.apiUrl}/${this.pageId}`, {
        params: {
          fields: 'instagram_business_account{id,name,username,profile_picture_url}',
          access_token: this.accessToken,
        },
      });
      
      const { instagram_business_account } = response.data;
      
      if (!instagram_business_account) {
        throw new Error('Conta de Instagram não encontrada para esta página');
      }
      
      this.profile = instagram_business_account;
      this.instagramAccountId = instagram_business_account.id;
      
      logger.info(`Perfil do Instagram recuperado: @${instagram_business_account.username}`);
      
      return this.profile;
    } catch (error) {
      logger.error(`Erro ao buscar perfil do Instagram: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Inicia polling de mensagens (alternativa ao webhook)
   */
  startMessagePolling() {
    const pollingInterval = config.instagram.pollingInterval || 10000; // 10 segundos
    
    this.pollingTimer = setInterval(async () => {
      try {
        await this.checkNewMessages();
      } catch (error) {
        logger.error(`Erro ao verificar novas mensagens: ${error.message}`);
      }
    }, pollingInterval);
    
    logger.info(`Polling de mensagens iniciado (intervalo: ${pollingInterval}ms)`);
  }
  
  /**
   * Verifica novas mensagens
   */
  async checkNewMessages() {
    try {
      const response = await axios.get(`${this.apiUrl}/${this.instagramAccountId}/conversations`, {
        params: {
          fields: 'participants,messages{id,from,to,message,attachments,timestamp}',
          access_token: this.accessToken,
        },
      });
      
      const { data } = response;
      
      if (!data || !data.data) {
        return;
      }
      
      // Processa conversas
      for (const conversation of data.data) {
        if (!conversation.messages || !conversation.messages.data) {
          continue;
        }
        
        // Processa mensagens
        for (const msg of conversation.messages.data) {
          // Verifica timestamp para evitar processar mensagens antigas
          const msgTime = new Date(msg.timestamp);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          
          if (msgTime > fiveMinutesAgo) {
            // Formata e emite evento de mensagem
            const formattedMessage = await this.formatMessage(msg, conversation);
            if (formattedMessage) {
              this.emit('message', formattedMessage);
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Erro ao verificar novas mensagens: ${error.message}`);
    }
  }
  
  /**
   * Configura webhook para receber mensagens
   * @param {string} webhookUrl - URL do webhook
   */
  async setupWebhook(webhookUrl) {
    try {
      this.webhookUrl = webhookUrl;
      
      const response = await axios.post(`${this.apiUrl}/${this.pageId}/subscribed_apps`, {
        subscribed_fields: 'messages,messaging_postbacks,messaging_optins',
        access_token: this.accessToken,
      });
      
      if (response.data && response.data.success) {
        logger.info(`Webhook configurado com sucesso para ${webhookUrl}`);
        return true;
      } else {
        throw new Error('Falha ao configurar webhook');
      }
    } catch (error) {
      logger.error(`Erro ao configurar webhook: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Processa evento do webhook
   * @param {Object} event - Evento do webhook
   */
  processWebhookEvent(event) {
    try {
      if (event.object !== 'instagram') {
        return;
      }
      
      // Processa entradas do webhook
      const entries = event.entry || [];
      
      for (const entry of entries) {
        const messaging = entry.messaging || [];
        
        for (const msg of messaging) {
          // Formata e emite evento de mensagem
          this.formatMessage(msg.message, { participants: { data: [{ id: msg.sender.id }] } })
            .then(formattedMessage => {
              if (formattedMessage) {
                this.emit('message', formattedMessage);
              }
            })
            .catch(error => {
              logger.error(`Erro ao processar mensagem do webhook: ${error.message}`);
            });
        }
      }
    } catch (error) {
      logger.error(`Erro ao processar evento do webhook: ${error.message}`);
    }
  }
  
  /**
   * Formata uma mensagem do Instagram
   * @param {Object} msg - Mensagem do Instagram
   * @param {Object} conversation - Informações da conversa
   * @returns {Object} Mensagem formatada
   */
  async formatMessage(msg, conversation) {
    try {
      // Extrai ID do remetente da conversa
      const participants = conversation?.participants?.data || [];
      const sender = participants.find(p => p.id !== this.instagramAccountId)?.id;
      
      if (!sender && !msg.from) {
        logger.warn('Não foi possível identificar o remetente da mensagem');
        return null;
      }
      
      const senderId = msg.from?.id || sender;
      const fromMe = senderId === this.instagramAccountId;
      
      // Extrai dados da mensagem
      let body = msg.message || '';
      let hasMedia = false;
      let mediaType = null;
      let mediaUrl = null;
      
      // Processa anexos, se existirem
      if (msg.attachments && msg.attachments.data && msg.attachments.data.length > 0) {
        const attachment = msg.attachments.data[0];
        hasMedia = true;
        
        // Define tipo de mídia
        if (attachment.image_data) {
          mediaType = 'image';
          mediaUrl = attachment.image_data.url;
        } else if (attachment.video_data) {
          mediaType = 'video';
          mediaUrl = attachment.video_data.url;
        } else if (attachment.file_url) {
          mediaType = 'document';
          mediaUrl = attachment.file_url;
        }
        
        // Baixa mídia se configurado
        if (mediaUrl && config.instagram.mediaCacheEnabled) {
          try {
            const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
            const extension = this.getExtensionFromUrl(mediaUrl);
            const filename = `${msg.id}.${extension}`;
            const filePath = path.join(this.mediaDir, filename);
            
            fs.writeFileSync(filePath, Buffer.from(mediaResponse.data));
            mediaUrl = `media/${this.clientId}/${filename}`;
          } catch (mediaError) {
            logger.error(`Erro ao baixar mídia: ${mediaError.message}`);
          }
        }
      }
      
      // Formata mensagem no formato comum
      return {
        id: msg.id,
        clientId: this.clientId,
        chatId: senderId,
        fromMe,
        sender: fromMe ? this.instagramAccountId : senderId,
        senderName: fromMe ? (this.profile?.username || 'You') : 'Instagram User',
        body,
        hasMedia,
        mediaType,
        mediaUrl,
        timestamp: new Date(msg.timestamp || Date.now()),
        metadata: {
          platform: 'instagram',
          messageType: hasMedia ? mediaType : 'text',
          rawMessage: config.app.env === 'development' ? msg : undefined,
        },
      };
    } catch (error) {
      logger.error(`Erro ao formatar mensagem: ${error.message}`);
      
      // Retorna formato básico em caso de erro
      return {
        id: msg.id || `instagram_${Date.now()}`,
        clientId: this.clientId,
        chatId: 'unknown',
        fromMe: false,
        body: msg.message || '',
        timestamp: new Date(),
        metadata: {
          platform: 'instagram',
        },
      };
    }
  }
  
  /**
   * Obtém extensão de arquivo a partir da URL
   * @param {string} url - URL do arquivo
   * @returns {string} Extensão
   */
  getExtensionFromUrl(url) {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = path.extname(pathname).substring(1);
    
    if (extension) {
      return extension;
    }
    
    // Extensões padrão baseadas em dicas da URL
    if (url.includes('image')) return 'jpg';
    if (url.includes('video')) return 'mp4';
    return 'bin';
  }
  
  /**
   * Verifica se o cliente está pronto
   * @returns {boolean}
   */
  isReady() {
    return this.ready;
  }
  
  /**
   * Obtém ID da conta do Instagram
   * @returns {string|null}
   */
  getPhoneNumber() {
    // No caso do Instagram, retornamos o ID da conta
    return this.instagramAccountId || null;
  }
  
  /**
   * Obtém nome de usuário configurado no Instagram
   * @returns {string|null}
   */
  getName() {
    return this.profile?.username || null;
  }
  
  /**
   * Envia mensagem de texto
   * @param {string} recipient - ID do destinatário
   * @param {string} text - Texto da mensagem
   * @returns {Promise<Object>} Mensagem enviada
   */
  async sendText(recipient, text) {
    if (!this.isReady()) {
      throw new Error('Cliente não está pronto');
    }
    
    try {
      const response = await axios.post(`${this.apiUrl}/${this.instagramAccountId}/messages`, {
        recipient: { id: recipient },
        message: { text },
        access_token: this.accessToken,
      });
      
      // Formata resposta
      return {
        id: response.data.message_id,
        chatId: recipient,
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
   * @param {string} recipient - ID do destinatário
   * @param {Object} media - Dados da mídia
   * @returns {Promise<Object>} Mensagem enviada
   */
  async sendMedia(recipient, media) {
    if (!this.isReady()) {
      throw new Error('Cliente não está pronto');
    }
    
    try {
      let result;
      
      switch (media.type) {
        case 'image': {
          // Primeiro fazemos upload da imagem
          const attachment_id = await this.uploadAttachment(media.data, 'image');
          
          // Depois enviamos usando o attachment_id
          const response = await axios.post(`${this.apiUrl}/${this.instagramAccountId}/messages`, {
            recipient: { id: recipient },
            message: {
              attachment: {
                type: 'image',
                payload: {
                  attachment_id,
                  caption: media.caption,
                },
              },
            },
            access_token: this.accessToken,
          });
          
          result = response.data;
          break;
        }
          
        case 'video': {
          // Primeiro fazemos upload do vídeo
          const attachment_id = await this.uploadAttachment(media.data, 'video');
          
          // Depois enviamos usando o attachment_id
          const response = await axios.post(`${this.apiUrl}/${this.instagramAccountId}/messages`, {
            recipient: { id: recipient },
            message: {
              attachment: {
                type: 'video',
                payload: {
                  attachment_id,
                  caption: media.caption,
                },
              },
            },
            access_token: this.accessToken,
          });
          
          result = response.data;
          break;
        }
          
        case 'audio':
        case 'document':
        default:
          throw new Error(`Tipo de mídia não suportado pelo Instagram: ${media.type}`);
      }
      
      // Formata resposta
      return {
        id: result.message_id,
        chatId: recipient,
        fromMe: true,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Erro ao enviar mídia: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Faz upload de um anexo
   * @param {string} mediaData - Caminho do arquivo ou URL ou base64
   * @param {string} type - Tipo de mídia ('image' ou 'video')
   * @returns {Promise<string>} ID do anexo
   */
  async uploadAttachment(mediaData, type) {
    try {
      const formData = new FormData();
      
      // Adiciona o arquivo ao FormData
      if (mediaData.startsWith('http')) {
        // URL - baixa o arquivo
        const response = await axios.get(mediaData, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        
        formData.append('filedata', buffer, {
          filename: `file.${type === 'image' ? 'jpg' : 'mp4'}`,
          contentType: type === 'image' ? 'image/jpeg' : 'video/mp4',
        });
      } else if (fs.existsSync(mediaData)) {
        // Caminho de arquivo local
        const fileStream = fs.createReadStream(mediaData);
        formData.append('filedata', fileStream);
      } else if (mediaData.startsWith('data:') || /^[A-Za-z0-9+/=]+$/.test(mediaData)) {
        // Data URL ou string base64
        const buffer = Buffer.from(mediaData.replace(/^data:.*?;base64,/, ''), 'base64');
        
        formData.append('filedata', buffer, {
          filename: `file.${type === 'image' ? 'jpg' : 'mp4'}`,
          contentType: type === 'image' ? 'image/jpeg' : 'video/mp4',
        });
      } else {
        throw new Error('Formato de mídia não suportado');
      }
      
      // Adiciona outros campos obrigatórios
      formData.append('access_token', this.accessToken);
      formData.append('message_type', 'image');
      
      // Faz o upload
      const response = await axios.post(
        `${this.apiUrl}/${this.instagramAccountId}/message_attachments`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );
      
      if (!response.data || !response.data.attachment_id) {
        throw new Error('Falha ao fazer upload do anexo');
      }
      
      return response.data.attachment_id;
    } catch (error) {
      logger.error(`Erro ao fazer upload de anexo: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * No Instagram, não há maneira direta de marcar uma mensagem como lida
   * Implementação para compatibilidade com a interface
   */
  async markChatAsRead(chatId) {
    logger.info(`Marcação de leitura não implementada para Instagram`);
    return true;
  }
  
  /**
   * Desconecta o cliente
   * @returns {Promise<boolean>} Sucesso
   */
  async logout() {
    try {
      this.authenticated = false;
      this.ready = false;
      
      // Para o polling de mensagens
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }
      
      logger.info(`Cliente Instagram ${this.clientId} desconectado`);
      return true;
    } catch (error) {
      logger.error(`Erro ao desconectar cliente Instagram: ${error.message}`);
      return false;
    }
  }
}

module.exports = InstagramAdapter;
