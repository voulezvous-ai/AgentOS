/**
 * Serviço WebSocket para comunicação em tempo real com o VOX
 */

class VoxWebSocketService {
  constructor() {
    this.socket = null;
    this.messageCallbacks = [];
    this.connectionCallbacks = {
      onConnect: [],
      onDisconnect: []
    };
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
  }

  /**
   * Inicia a conexão WebSocket
   */
  connect() {
    // Determinar host dinâmicamente
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/vox/ws`;
    
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      console.log('WebSocket já está conectado');
      return;
    }
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log('Conexão WebSocket estabelecida');
      this.reconnectAttempts = 0;
      this._triggerCallbacks('onConnect');
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this._triggerMessageCallbacks(data);
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };
    
    this.socket.onclose = (event) => {
      console.log('Conexão WebSocket fechada', event.code, event.reason);
      this._triggerCallbacks('onDisconnect', event);
      
      // Tenta reconectar se não foi um fechamento limpo
      if (event.code !== 1000 && event.code !== 1001) {
        this._attemptReconnect();
      }
    };
    
    this.socket.onerror = (error) => {
      console.error('Erro na conexão WebSocket:', error);
    };
  }
  
  /**
   * Tenta reconectar automaticamente em caso de queda
   */
  _attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Número máximo de tentativas de reconexão atingido');
      return;
    }
    
    this.reconnectAttempts++;
    
    // Tempo exponencial de backoff
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('Tentando reconectar...');
      this.connect();
    }, delay);
  }
  
  /**
   * Fecha a conexão WebSocket
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }
  
  /**
   * Envia uma mensagem para o servidor via WebSocket
   */
  sendMessage(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket não está conectado');
      this.connect();
      // Poderia adicionar uma fila de mensagens pendentes aqui
      return false;
    }
    
    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }
  
  /**
   * Registra callback para receber mensagens
   */
  onMessage(callback) {
    if (typeof callback === 'function') {
      this.messageCallbacks.push(callback);
    }
    return this; // Para encadeamento
  }
  
  /**
   * Registra callback para eventos de conexão
   */
  onConnect(callback) {
    if (typeof callback === 'function') {
      this.connectionCallbacks.onConnect.push(callback);
    }
    return this;
  }
  
  /**
   * Registra callback para eventos de desconexão
   */
  onDisconnect(callback) {
    if (typeof callback === 'function') {
      this.connectionCallbacks.onDisconnect.push(callback);
    }
    return this;
  }
  
  /**
   * Dispara callbacks registrados para mensagens
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
   * Dispara callbacks registrados para eventos de conexão
   */
  _triggerCallbacks(type, event = null) {
    const callbacks = this.connectionCallbacks[type] || [];
    callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Erro em callback ${type}:`, error);
      }
    });
  }
}

// Exporta uma instância singleton do serviço
const voxWebSocketService = new VoxWebSocketService();
export default voxWebSocketService;
