/**
 * Serviço WebSocket genérico e reutilizável para o AgentOS
 * Pode ser usado para diferentes tipos de chat (Vox, estafetas, etc)
 */

import getReconnectDelay from './reconnectHelper';

class WebSocketService {
  /**
   * Cria uma nova instância do serviço WebSocket
   * @param {Object} config - Configuração do serviço
   * @param {string} config.endpoint - Endpoint do WebSocket (por exemplo: '/api/vox/ws', '/api/chat/couriers')
   * @param {number} config.maxReconnectAttempts - Número máximo de tentativas de reconexão
   * @param {function} config.onMessage - Handler padrão para mensagens recebidas
   * @param {function} config.onConnect - Handler para evento de conexão
   * @param {function} config.onDisconnect - Handler para evento de desconexão
   * @param {boolean} config.autoConnect - Se deve conectar automaticamente ao criar instância
   * @param {Object} config.defaultHeaders - Headers padrão para a conexão (para WebSocket nativo)
   */
  constructor(config = {}) {
    this.endpoint = config.endpoint || '/ws';
    this.socket = null;
    this.connected = false;
    this.connecting = false;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
    this.reconnectEnabled = true;
    this.defaultHeaders = config.defaultHeaders || {};
    
    // Callbacks
    this.messageCallbacks = [];
    this.connectionCallbacks = {
      onConnect: [],
      onDisconnect: []
    };
    
    // Adicionar callbacks padrão se fornecidos
    if (typeof config.onMessage === 'function') {
      this.onMessage(config.onMessage);
    }
    
    if (typeof config.onConnect === 'function') {
      this.onConnect(config.onConnect);
    }
    
    if (typeof config.onDisconnect === 'function') {
      this.onDisconnect(config.onDisconnect);
    }
    
    // Auto-conectar se configurado
    if (config.autoConnect) {
      this.connect();
    }
    
    // Desconectar ao fechar a página/aba
    this._setupWindowListeners();
  }
  
  /**
   * Configura event listeners de janela
   */
  _setupWindowListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disconnect(1000, 'Page navigation');
      });
      
      // Reconectar quando a janela se tornar visível novamente
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.connected && !this.connecting) {
          this.connect();
        }
      });
    }
  }
  
  /**
   * Constrói a URL do WebSocket completa
   */
  _buildWsUrl() {
    if (typeof window === 'undefined') {
      return this.endpoint; // Servidor ou teste
    }
    
    // Protocolo baseado na conexão atual (HTTP -> WS, HTTPS -> WSS)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // Remove barra inicial se existir no endpoint e no host
    const sanitizedEndpoint = this.endpoint.startsWith('/') 
      ? this.endpoint.substring(1) 
      : this.endpoint;
      
    return `${protocol}//${host}/${sanitizedEndpoint}`;
  }
  
  /**
   * Inicia a conexão WebSocket
   */
  connect() {
    if (this.connected || this.connecting) {
      console.log('WebSocket já está conectado ou conectando');
      return false;
    }
    
    this.connecting = true;
    
    try {
      const wsUrl = this._buildWsUrl();
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this._handleOpen.bind(this);
      this.socket.onmessage = this._handleMessage.bind(this);
      this.socket.onclose = this._handleClose.bind(this);
      this.socket.onerror = this._handleError.bind(this);
      
      return true;
    } catch (error) {
      console.error('Erro ao iniciar conexão WebSocket:', error);
      this.connecting = false;
      return false;
    }
  }
  
  /**
   * Manipula evento de abertura da conexão
   */
  _handleOpen() {
    console.log(`WebSocket conectado a ${this.endpoint}`);
    this.connected = true;
    this.connecting = false;
    this.reconnectAttempts = 0;
    this._triggerConnectionCallbacks('onConnect');
  }
  
  /**
   * Manipula mensagens recebidas
   */
  _handleMessage(event) {
    try {
      const data = (typeof event.data === 'string') 
        ? JSON.parse(event.data) 
        : event.data;
      this._triggerMessageCallbacks(data);
    } catch (error) {
      console.error('Erro ao processar mensagem WebSocket:', error);
    }
  }
  
  /**
   * Manipula fechamento da conexão
   */
  _handleClose(event) {
    console.log(`WebSocket desconectado: ${event.code} - ${event.reason}`);
    this.connected = false;
    this.connecting = false;
    this._triggerConnectionCallbacks('onDisconnect', event);
    
    // Tentativa automática de reconexão para códigos não-normais
    if (this.reconnectEnabled && event.code !== 1000 && event.code !== 1001) {
      this._attemptReconnect();
    }
  }
  
  /**
   * Manipula erros de conexão
   */
  _handleError(error) {
    console.error('Erro na conexão WebSocket:', error);
    this.connecting = false;
  }
  
  /**
   * Tenta reconectar automaticamente com backoff exponencial
   */
  _attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Número máximo de tentativas de reconexão atingido');
      return;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectAttempts++;
    
    const delay = getReconnectDelay(this.reconnectAttempts);
    
    console.log(`Tentando reconectar em ${Math.round(delay)}ms (tentativa ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('Tentando reconectar...');
      this.connect();
    }, delay);
  }
  
  /**
   * Fecha a conexão WebSocket
   * @param {number} code - Código de fechamento (1000 para fechamento normal)
   * @param {string} reason - Razão do fechamento
   */
  disconnect(code = 1000, reason = 'User initiated disconnect') {
    this.reconnectEnabled = false; // Desativa reconexão automática
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket && (this.connected || this.connecting)) {
      try {
        this.socket.close(code, reason);
      } catch (error) {
        console.error('Erro ao fechar WebSocket:', error);
      }
    }
    
    this.connected = false;
    this.connecting = false;
  }
  
  /**
   * Envia uma mensagem para o servidor
   * @param {Object|string} message - Mensagem a ser enviada (será convertida para JSON se for objeto)
   * @returns {boolean} Sucesso do envio
   */
  send(message) {
    if (!this.connected) {
      console.warn('Tentativa de enviar mensagem com WebSocket desconectado');
      
      // Tenta reconectar e agendar a mensagem para envio após conexão
      if (!this.connecting) {
        this.connect();
        
        // Poderia implementar uma fila de mensagens pendentes aqui
        // para enviar após reconexão
      }
      
      return false;
    }
    
    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(data);
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem WebSocket:', error);
      return false;
    }
  }
  
  /**
   * Adiciona um callback para mensagens recebidas
   * @param {Function} callback - Função a ser chamada quando uma mensagem for recebida
   * @returns {WebSocketService} Instância para encadeamento
   */
  onMessage(callback) {
    if (typeof callback === 'function') {
      this.messageCallbacks.push(callback);
    }
    return this;
  }
  
  /**
   * Remove um callback de mensagens
   * @param {Function} callback - Função a ser removida
   * @returns {WebSocketService} Instância para encadeamento
   */
  offMessage(callback) {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    return this;
  }
  
  /**
   * Adiciona um callback para evento de conexão
   * @param {Function} callback - Função a ser chamada quando conectar
   * @returns {WebSocketService} Instância para encadeamento
   */
  onConnect(callback) {
    if (typeof callback === 'function') {
      this.connectionCallbacks.onConnect.push(callback);
    }
    return this;
  }
  
  /**
   * Adiciona um callback para evento de desconexão
   * @param {Function} callback - Função a ser chamada quando desconectar
   * @returns {WebSocketService} Instância para encadeamento
   */
  onDisconnect(callback) {
    if (typeof callback === 'function') {
      this.connectionCallbacks.onDisconnect.push(callback);
    }
    return this;
  }
  
  /**
   * Dispara todos os callbacks de mensagem registrados
   * @param {Object} data - Dados da mensagem
   */
  _triggerMessageCallbacks(data) {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Erro em callback de mensagem:', error);
      }
    });
  }
  
  /**
   * Dispara todos os callbacks de conexão registrados
   * @param {string} type - Tipo de evento (onConnect, onDisconnect)
   * @param {Event} event - Evento original, se disponível
   */
  _triggerConnectionCallbacks(type, event = null) {
    const callbacks = this.connectionCallbacks[type] || [];
    callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Erro em callback ${type}:`, error);
      }
    });
  }
  
  /**
   * Verifica se o WebSocket está conectado
   * @returns {boolean} Estado da conexão
   */
  isConnected() {
    return this.connected;
  }
}

/**
 * Função para criar instâncias WebSocket para serviços específicos
 */
export const createWebSocketService = (config) => {
  return new WebSocketService(config);
};

// Instância do WebSocket para o VOX
export const voxWebSocketService = new WebSocketService({
  endpoint: '/api/vox/ws',
  autoConnect: false
});

// Instância do WebSocket para o chat de estafetas
export const courierChatService = new WebSocketService({
  endpoint: '/api/chat/couriers',
  autoConnect: false
});

export default WebSocketService;
