/**
 * Serviço para gerenciar conexões WebSocket
 * Responsável por gerenciar conexões, autenticação e distribuição de mensagens
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { wsServerConfig } = require('../config/websocket');
const messageController = require('../controllers/messageController');

/**
 * Classe para gerenciar o servidor WebSocket
 */
class WebSocketService {
  /**
   * Inicializa o serviço WebSocket
   * @param {Object} server - Servidor HTTP para anexar o WebSocket
   */
  constructor(server) {
    this.server = null;
    this.clients = new Map(); // userId -> websocket
    this.channels = new Map(); // channel -> Set<userId>
    this.httpServer = server;
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  /**
   * Inicializa o servidor WebSocket
   */
  initialize() {
    // Criar servidor WebSocket
    this.server = new WebSocket.Server({
      server: this.httpServer,
      path: wsServerConfig.path,
      ...wsServerConfig
    });

    // Configurar event handlers
    this.server.on('connection', this.handleConnection.bind(this));
    this.server.on('error', (error) => {
      logger.error('WebSocket server error:', error);
    });

    logger.info(`WebSocket server initialized on path: ${wsServerConfig.path}`);
    
    // Iniciar monitoramento de conexões
    this.startConnectionMonitoring();
    
    return this;
  }

  /**
   * Manipula uma nova conexão WebSocket
   * @param {Object} ws - Conexão WebSocket
   * @param {Object} req - Requisição HTTP
   */
  async handleConnection(ws, req) {
    try {
      // Extrair token de autenticação
      const token = this.extractToken(req);
      
      if (!token) {
        logger.warn('Connection attempt without token');
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Authentication required' 
        }));
        ws.close(1008, 'Authentication required');
        return;
      }
      
      // Validar token
      const userData = await this.validateToken(token);
      
      if (!userData) {
        logger.warn('Connection attempt with invalid token');
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid authentication' 
        }));
        ws.close(1008, 'Invalid authentication');
        return;
      }
      
      // Gerar ID de conexão único
      const connectionId = uuidv4();
      
      // Configurar o websocket
      ws.userId = userData.userId;
      ws.userName = userData.name || 'Unknown User';
      ws.connectionId = connectionId;
      ws.isAlive = true;
      ws.channels = new Set(['default']); // Canal padrão
      
      // Adicionar à lista de clientes
      this.clients.set(userData.userId, ws);
      
      // Adicionar ao canal padrão
      this.addToChannel('default', userData.userId);
      
      logger.info(`User ${userData.userId} connected with connection ID ${connectionId}`);
      
      // Enviar confirmação de conexão
      ws.send(JSON.stringify({
        type: 'connection_established',
        connectionId,
        userId: userData.userId,
        userName: userData.name,
        timestamp: new Date()
      }));
      
      // Configurar event handlers
      ws.on('message', (message) => this.handleMessage(message, ws));
      ws.on('close', () => this.handleDisconnection(ws));
      ws.on('error', (error) => this.handleError(error, ws));
      ws.on('pong', () => { ws.isAlive = true; });
      
      // Configurar change streams para canais
      await this.setupChannelChangeStreams(ws.channels);
    } catch (error) {
      logger.error('Error handling new connection:', error);
      ws.close(1011, 'Internal server error');
    }
  }

  /**
   * Manipula uma mensagem recebida
   * @param {Buffer} message - Mensagem recebida
   * @param {Object} ws - Conexão WebSocket
   */
  async handleMessage(message, ws) {
    try {
      // Atualizar status do cliente
      ws.isAlive = true;
      
      // Parsear mensagem
      const data = JSON.parse(message.toString());
      
      // Verificar tipo de mensagem
      switch (data.type) {
        case 'subscribe':
          // Inscrever em um canal
          await this.handleSubscription(data, ws);
          break;
          
        case 'unsubscribe':
          // Cancelar inscrição em um canal
          this.handleUnsubscription(data, ws);
          break;
          
        case 'chat':
        case 'typing':
        case 'read_receipt':
          // Processar mensagem de chat
          await messageController.handleMessage(data, ws.userId, ws, this.broadcast.bind(this));
          break;
          
        case 'ping':
          // Responder ping
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
          break;
          
        default:
          // Tipo de mensagem desconhecido
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Unknown message type' 
          }));
          break;
      }
    } catch (error) {
      logger.error(`Error handling message from ${ws.userId}:`, error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Error processing message'
      }));
    }
  }

  /**
   * Manipula a inscrição em um canal
   * @param {Object} data - Dados da requisição
   * @param {Object} ws - Conexão WebSocket
   */
  async handleSubscription(data, ws) {
    try {
      // Validar canal
      if (!data.channel) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Channel name is required'
        }));
        return;
      }
      
      // Adicionar cliente ao canal
      this.addToChannel(data.channel, ws.userId);
      ws.channels.add(data.channel);
      
      // Configurar change stream para o canal
      await this.setupChannelChangeStreams(new Set([data.channel]));
      
      // Buscar histórico do canal (opcional)
      let history = [];
      if (data.fetchHistory) {
        const limit = data.historyLimit || 50;
        history = await messageController.getChannelHistory(data.channel, limit);
      }
      
      // Confirmar inscrição
      ws.send(JSON.stringify({
        type: 'subscription_confirmed',
        channel: data.channel,
        timestamp: new Date(),
        history: data.fetchHistory ? history : undefined
      }));
      
      logger.info(`User ${ws.userId} subscribed to channel: ${data.channel}`);
    } catch (error) {
      logger.error(`Error handling subscription to ${data.channel} for ${ws.userId}:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to subscribe to channel'
      }));
    }
  }

  /**
   * Manipula o cancelamento de inscrição em um canal
   * @param {Object} data - Dados da requisição
   * @param {Object} ws - Conexão WebSocket
   */
  handleUnsubscription(data, ws) {
    try {
      // Validar canal
      if (!data.channel) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Channel name is required'
        }));
        return;
      }
      
      // Remover cliente do canal
      this.removeFromChannel(data.channel, ws.userId);
      ws.channels.delete(data.channel);
      
      // Confirmar cancelamento
      ws.send(JSON.stringify({
        type: 'unsubscription_confirmed',
        channel: data.channel,
        timestamp: new Date()
      }));
      
      logger.info(`User ${ws.userId} unsubscribed from channel: ${data.channel}`);
      
      // Se ninguém mais estiver no canal, fechar o change stream
      const channelClients = this.channels.get(data.channel);
      if (!channelClients || channelClients.size === 0) {
        messageController.closeChannelStream(data.channel);
        logger.info(`Closed change stream for channel ${data.channel} - no more subscribers`);
      }
    } catch (error) {
      logger.error(`Error handling unsubscription from ${data.channel} for ${ws.userId}:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to unsubscribe from channel'
      }));
    }
  }

  /**
   * Manipula a desconexão de um cliente
   * @param {Object} ws - Conexão WebSocket
   */
  handleDisconnection(ws) {
    try {
      // Remover cliente de todos os canais
      if (ws.channels) {
        for (const channel of ws.channels) {
          this.removeFromChannel(channel, ws.userId);
        }
      }
      
      // Remover da lista de clientes
      this.clients.delete(ws.userId);
      
      logger.info(`User ${ws.userId} disconnected (connection ID: ${ws.connectionId})`);
      
      // Verificar canais vazios e fechar change streams desnecessários
      this.cleanupEmptyChannels();
    } catch (error) {
      logger.error(`Error handling disconnection for ${ws.userId}:`, error);
    }
  }

  /**
   * Manipula erros de conexão
   * @param {Error} error - Erro ocorrido
   * @param {Object} ws - Conexão WebSocket
   */
  handleError(error, ws) {
    logger.error(`WebSocket error for user ${ws.userId}:`, error);
  }

  /**
   * Adiciona um cliente a um canal
   * @param {string} channel - Nome do canal
   * @param {string} userId - ID do usuário
   */
  addToChannel(channel, userId) {
    // Criar canal se não existir
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    
    // Adicionar cliente ao canal
    this.channels.get(channel).add(userId);
  }

  /**
   * Remove um cliente de um canal
   * @param {string} channel - Nome do canal
   * @param {string} userId - ID do usuário
   */
  removeFromChannel(channel, userId) {
    // Verificar se o canal existe
    if (this.channels.has(channel)) {
      // Remover cliente do canal
      this.channels.get(channel).delete(userId);
      
      // Se o canal estiver vazio, remover
      if (this.channels.get(channel).size === 0) {
        this.channels.delete(channel);
      }
    }
  }

  /**
   * Envia uma mensagem para todos os clientes em um canal
   * @param {string} channel - Nome do canal (null para mensagem direta)
   * @param {Object} message - Mensagem a ser enviada
   * @param {string} targetUserId - ID do usuário específico (para mensagens diretas)
   */
  broadcast(channel, message, targetUserId = null) {
    try {
      // Definir a quem enviar
      const targets = new Set();
      
      if (targetUserId) {
        // Mensagem direta para um usuário específico
        targets.add(targetUserId);
      } else if (channel) {
        // Mensagem para um canal
        const channelClients = this.channels.get(channel);
        if (channelClients) {
          channelClients.forEach(userId => targets.add(userId));
        }
      } else {
        // Nenhum canal ou usuário especificado - não fazer nada
        logger.warn('Broadcast called without channel or target user ID');
        return;
      }
      
      // Enviar mensagem para todos os alvos
      const messageStr = JSON.stringify(message);
      targets.forEach(userId => {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
      
      logger.debug(`Broadcast message to ${targets.size} clients`);
    } catch (error) {
      logger.error('Error broadcasting message:', error);
    }
  }

  /**
   * Configura change streams para os canais especificados
   * @param {Set<string>} channels - Conjunto de canais
   */
  async setupChannelChangeStreams(channels) {
    try {
      for (const channel of channels) {
        await messageController.setupChannelStream(channel, (message) => {
          this.broadcast(channel, {
            type: 'new_message',
            message
          });
        });
      }
    } catch (error) {
      logger.error('Error setting up channel change streams:', error);
    }
  }

  /**
   * Limpa canais vazios e fecha change streams desnecessários
   */
  cleanupEmptyChannels() {
    try {
      const activeChannels = new Set();
      
      // Coletar todos os canais ativos
      this.clients.forEach(client => {
        if (client.channels) {
          client.channels.forEach(channel => activeChannels.add(channel));
        }
      });
      
      // Fechar change streams para canais sem clientes
      const activeStreams = messageController.getActiveStreams();
      for (const stream of activeStreams) {
        if (!activeChannels.has(stream.channel)) {
          messageController.closeChannelStream(stream.channel);
          logger.info(`Closed change stream for inactive channel: ${stream.channel}`);
        }
      }
    } catch (error) {
      logger.error('Error cleaning up empty channels:', error);
    }
  }

  /**
   * Inicia monitoramento de conexões para manter clients vivos
   */
  startConnectionMonitoring() {
    // Verificar conexões a cada 30 segundos
    const interval = setInterval(() => {
      this.server.clients.forEach(ws => {
        if (ws.isAlive === false) {
          logger.info(`Terminating inactive connection for user ${ws.userId}`);
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, wsServerConfig.pingInterval);

    // Limpar intervalo quando o servidor fechar
    this.server.on('close', () => {
      clearInterval(interval);
    });
    
    logger.info(`Connection monitoring started with interval ${wsServerConfig.pingInterval}ms`);
  }

  /**
   * Extrai token de autenticação da requisição
   * @param {Object} req - Requisição HTTP
   * @returns {string|null} Token de autenticação ou null
   */
  extractToken(req) {
    try {
      // Verificar query param
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      if (token) return token;
      
      // Verificar cabeçalho de autorização
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      
      return null;
    } catch (error) {
      logger.error('Error extracting token:', error);
      return null;
    }
  }

  /**
   * Valida um token de autenticação
   * @param {string} token - Token a ser validado
   * @returns {Promise<Object|null>} Dados do usuário ou null se inválido
   */
  async validateToken(token) {
    try {
      // Verificar token JWT
      const decoded = jwt.verify(token, this.jwtSecret);
      
      return {
        userId: decoded.userId || decoded.sub,
        name: decoded.name,
        role: decoded.role
      };
    } catch (error) {
      logger.error('Error validating token:', error);
      return null;
    }
  }

  /**
   * Encerra o servidor WebSocket
   */
  shutdown() {
    try {
      // Fechar todos os change streams
      messageController.closeAllStreams();
      
      // Notificar clientes e fechar conexões
      this.server.clients.forEach(client => {
        client.send(JSON.stringify({
          type: 'server_shutdown',
          message: 'Server is shutting down',
          timestamp: new Date()
        }));
        client.close(1001, 'Server shutting down');
      });
      
      // Fechar servidor
      this.server.close();
      logger.info('WebSocket server shut down');
    } catch (error) {
      logger.error('Error shutting down WebSocket server:', error);
    }
  }
}

module.exports = WebSocketService;
