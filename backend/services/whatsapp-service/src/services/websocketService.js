/**
 * WebSocket Service para o serviço WhatsApp do AgentOS
 * Gerencia conexões WebSocket e fornece comunicação em tempo real
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { logger } = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.connections = new Map();
    this.clientAssociations = new Map(); // Mapeia IDs de cliente WhatsApp para conexões WebSocket
  }

  /**
   * Inicializa o servidor WebSocket
   * @param {Object} server - Servidor HTTP
   */
  initialize(server) {
    logger.info('Inicializando serviço WebSocket para WhatsApp');
    
    if (!config.websocket.enabled) {
      logger.info('WebSocket está desabilitado na configuração');
      return;
    }

    this.wss = new WebSocket.Server({
      server,
      path: config.websocket.path,
      maxPayload: config.websocket.maxPayloadSize
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    
    logger.info(`Servidor WebSocket inicializado no caminho: ${config.websocket.path}`);
    this.startHeartbeatCheck();
  }

  /**
   * Gerencia uma nova conexão WebSocket
   * @param {WebSocket} ws - Conexão WebSocket
   * @param {Object} req - Requisição HTTP
   */
  handleConnection(ws, req) {
    const connectionId = uuidv4();
    
    // Extrai parâmetros de query da URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const clientId = url.searchParams.get('clientId');
    
    let userId;
    
    try {
      // Verifica autenticação
      if (!token) {
        throw new Error('Token não fornecido');
      }
      
      const decoded = jwt.verify(token, config.security.jwtSecret);
      userId = decoded.userId;
      
      if (!userId) {
        throw new Error('Token inválido');
      }
      
      // Armazena informações da conexão
      this.connections.set(connectionId, {
        ws,
        connectionId,
        userId,
        clientId,
        lastPong: Date.now(),
        isAlive: true
      });
      
      // Associa cliente WhatsApp à conexão, se for especificado
      if (clientId) {
        if (!this.clientAssociations.has(clientId)) {
          this.clientAssociations.set(clientId, new Set());
        }
        this.clientAssociations.get(clientId).add(connectionId);
      }
      
      logger.info(`Nova conexão WebSocket estabelecida: ${connectionId}`);
      
      // Envia confirmação de conexão
      this.send(connectionId, {
        type: 'connection',
        status: 'connected',
        connectionId,
        timestamp: new Date().toISOString()
      });
      
      // Configura handlers para a conexão
      ws.on('message', (message) => this.handleMessage(connectionId, message));
      ws.on('close', () => this.handleClose(connectionId));
      ws.on('error', (error) => this.handleError(connectionId, error));
      ws.on('pong', () => this.handlePong(connectionId));
      
    } catch (error) {
      logger.error(`Erro na conexão WebSocket: ${error.message}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Falha na autenticação',
        timestamp: new Date().toISOString()
      }));
      ws.terminate();
    }
  }

  /**
   * Processa mensagens recebidas via WebSocket
   * @param {string} connectionId - ID da conexão
   * @param {string} message - Mensagem recebida
   */
  handleMessage(connectionId, message) {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      logger.warn(`Mensagem recebida de conexão não registrada: ${connectionId}`);
      return;
    }
    
    try {
      const parsedMessage = JSON.parse(message);
      
      logger.debug(`Mensagem recebida de ${connectionId}: ${JSON.stringify(parsedMessage)}`);
      
      // Atualiza status da conexão
      connection.lastActivity = Date.now();
      
      // Processa diferentes tipos de mensagem
      switch (parsedMessage.type) {
        case 'ping':
          this.send(connectionId, { type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        case 'subscribe':
          this.handleSubscription(connectionId, parsedMessage);
          break;
          
        case 'whatsapp_command':
          this.handleWhatsAppCommand(connectionId, parsedMessage);
          break;
          
        default:
          logger.warn(`Tipo de mensagem desconhecido: ${parsedMessage.type}`);
          this.send(connectionId, {
            type: 'error',
            message: 'Tipo de mensagem não suportado',
            originalType: parsedMessage.type,
            timestamp: new Date().toISOString()
          });
      }
    } catch (error) {
      logger.error(`Erro ao processar mensagem de ${connectionId}: ${error.message}`);
      this.send(connectionId, {
        type: 'error',
        message: 'Erro ao processar mensagem',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Gerencia subscrições para atualizações específicas
   * @param {string} connectionId - ID da conexão
   * @param {Object} message - Mensagem de subscrição
   */
  handleSubscription(connectionId, message) {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      logger.warn(`Subscrição de conexão não registrada: ${connectionId}`);
      return;
    }
    
    const { clientId, action } = message;
    
    if (!clientId) {
      this.send(connectionId, {
        type: 'error',
        message: 'clientId é obrigatório para subscrições',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    if (action === 'subscribe') {
      // Associa conexão ao cliente WhatsApp
      if (!this.clientAssociations.has(clientId)) {
        this.clientAssociations.set(clientId, new Set());
      }
      this.clientAssociations.get(clientId).add(connectionId);
      
      logger.info(`Conexão ${connectionId} inscrita em atualizações do cliente ${clientId}`);
      
      this.send(connectionId, {
        type: 'subscription',
        status: 'subscribed',
        clientId,
        timestamp: new Date().toISOString()
      });
      
    } else if (action === 'unsubscribe') {
      // Remove associação com cliente WhatsApp
      if (this.clientAssociations.has(clientId)) {
        this.clientAssociations.get(clientId).delete(connectionId);
        
        // Remove Set se estiver vazio
        if (this.clientAssociations.get(clientId).size === 0) {
          this.clientAssociations.delete(clientId);
        }
      }
      
      logger.info(`Conexão ${connectionId} cancelou inscrição em atualizações do cliente ${clientId}`);
      
      this.send(connectionId, {
        type: 'subscription',
        status: 'unsubscribed',
        clientId,
        timestamp: new Date().toISOString()
      });
      
    } else {
      this.send(connectionId, {
        type: 'error',
        message: 'Ação de subscrição inválida',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Processa comandos específicos para o WhatsApp
   * @param {string} connectionId - ID da conexão
   * @param {Object} message - Comando para o WhatsApp
   */
  handleWhatsAppCommand(connectionId, message) {
    // Esta função seria implementada para processar comandos específicos
    // como enviar mensagens, gerar QR code, etc.
    logger.info(`Comando WhatsApp recebido de ${connectionId}: ${JSON.stringify(message)}`);
    
    // Resposta genérica por enquanto
    this.send(connectionId, {
      type: 'command_received',
      command: message.command,
      status: 'processing',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Gerencia fechamento de conexão
   * @param {string} connectionId - ID da conexão
   */
  handleClose(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      return;
    }
    
    logger.info(`Conexão WebSocket fechada: ${connectionId}`);
    
    // Remove conexão de associações com clientes WhatsApp
    if (connection.clientId && this.clientAssociations.has(connection.clientId)) {
      this.clientAssociations.get(connection.clientId).delete(connectionId);
      
      if (this.clientAssociations.get(connection.clientId).size === 0) {
        this.clientAssociations.delete(connection.clientId);
      }
    }
    
    // Remove conexão do registro
    this.connections.delete(connectionId);
  }

  /**
   * Gerencia erros de conexão
   * @param {string} connectionId - ID da conexão
   * @param {Error} error - Erro ocorrido
   */
  handleError(connectionId, error) {
    logger.error(`Erro na conexão WebSocket ${connectionId}: ${error.message}`);
    
    // Pode implementar lógica adicional de tratamento de erro aqui
    const connection = this.connections.get(connectionId);
    
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify({
        type: 'error',
        message: 'Erro no servidor',
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Registra resposta de pong para verificação de heartbeat
   * @param {string} connectionId - ID da conexão
   */
  handlePong(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (connection) {
      connection.isAlive = true;
      connection.lastPong = Date.now();
    }
  }

  /**
   * Envia mensagem para uma conexão específica
   * @param {string} connectionId - ID da conexão
   * @param {Object} message - Mensagem a ser enviada
   */
  send(connectionId, message) {
    const connection = this.connections.get(connectionId);
    
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      logger.debug(`Não é possível enviar para conexão ${connectionId}: conexão não encontrada ou fechada`);
      return false;
    }
    
    try {
      const messageString = JSON.stringify(message);
      connection.ws.send(messageString);
      return true;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem para ${connectionId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Envia mensagem para todas as conexões associadas a um cliente WhatsApp
   * @param {string} clientId - ID do cliente WhatsApp
   * @param {Object} message - Mensagem a ser enviada
   */
  broadcastToClient(clientId, message) {
    if (!this.clientAssociations.has(clientId)) {
      logger.debug(`Nenhuma conexão associada ao cliente WhatsApp ${clientId}`);
      return 0;
    }
    
    let sentCount = 0;
    
    for (const connectionId of this.clientAssociations.get(clientId)) {
      if (this.send(connectionId, message)) {
        sentCount++;
      }
    }
    
    logger.debug(`Mensagem enviada para ${sentCount} conexões do cliente ${clientId}`);
    return sentCount;
  }

  /**
   * Envia mensagem para todas as conexões ativas
   * @param {Object} message - Mensagem a ser enviada
   */
  broadcastToAll(message) {
    let sentCount = 0;
    
    for (const connectionId of this.connections.keys()) {
      if (this.send(connectionId, message)) {
        sentCount++;
      }
    }
    
    logger.debug(`Mensagem enviada para ${sentCount} conexões`);
    return sentCount;
  }

  /**
   * Inicia verificação periódica de heartbeat
   */
  startHeartbeatCheck() {
    const interval = config.websocket.heartbeatInterval;
    
    setInterval(() => {
      const now = Date.now();
      const timeout = config.websocket.connectionTimeout;
      
      for (const [connectionId, connection] of this.connections.entries()) {
        if (now - connection.lastPong > timeout) {
          // Tempo limite excedido, encerra conexão
          logger.warn(`Conexão ${connectionId} excedeu tempo limite, terminando`);
          connection.ws.terminate();
          this.handleClose(connectionId);
        } else if (connection.ws.readyState === WebSocket.OPEN) {
          // Envia ping
          connection.isAlive = false;
          connection.ws.ping();
        }
      }
    }, interval);
  }

  /**
   * Encerra o serviço WebSocket
   */
  shutdown() {
    if (this.wss) {
      logger.info('Encerrando serviço WebSocket');
      
      // Fecha todas as conexões
      for (const connection of this.connections.values()) {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.close(1000, 'Servidor encerrando');
        }
      }
      
      // Limpa registros
      this.connections.clear();
      this.clientAssociations.clear();
      
      // Fecha servidor
      this.wss.close();
      this.wss = null;
      
      logger.info('Serviço WebSocket encerrado');
    }
  }
}

module.exports = new WebSocketService();
