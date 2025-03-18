/**
 * Testes para o serviço WebSocket
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { WebSocketService } = require('../src/services/websocketService');
const { MessageService } = require('../src/services/messageService');

// Mock para o logger
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock para o serviço de mensagens
jest.mock('../src/services/messageService');

describe('WebSocketService', () => {
  let webSocketService;
  let mockMessageService;
  const jwtSecret = 'test-secret';
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Criar um mock do MessageService
    mockMessageService = new MessageService();
    mockMessageService.saveMessage = jest.fn().mockResolvedValue({ 
      _id: 'msg-123', 
      content: 'Mensagem de teste' 
    });
    mockMessageService.getConversationHistory = jest.fn().mockResolvedValue([
      { _id: 'msg-1', content: 'Mensagem 1' },
      { _id: 'msg-2', content: 'Mensagem 2' }
    ]);
    
    // Inicializar o serviço WebSocket
    webSocketService = new WebSocketService({
      messageService: mockMessageService,
      jwtSecret
    });
  });
  
  describe('autenticarCliente', () => {
    it('deve autenticar um cliente com token válido', () => {
      // Arrange
      const userId = 'user-123';
      const token = jwt.sign({ userId }, jwtSecret, { expiresIn: '1h' });
      const ws = { id: 'conn-123', send: jest.fn() };
      
      // Act
      const result = webSocketService.autenticarCliente(ws, token);
      
      // Assert
      expect(result).toBe(true);
      expect(ws.userId).toBe(userId);
      expect(ws.isAuthenticated).toBe(true);
    });
    
    it('deve rejeitar um cliente com token inválido', () => {
      // Arrange
      const token = 'invalid-token';
      const ws = { id: 'conn-123', send: jest.fn() };
      
      // Act
      const result = webSocketService.autenticarCliente(ws, token);
      
      // Assert
      expect(result).toBe(false);
      expect(ws.isAuthenticated).toBeUndefined();
    });
  });
  
  describe('processarMensagem', () => {
    it('deve processar mensagem corretamente e salvar no banco', async () => {
      // Arrange
      const ws = { 
        id: 'conn-123', 
        userId: 'user-123', 
        isAuthenticated: true,
        send: jest.fn()
      };
      
      const mensagem = {
        type: 'MESSAGE',
        payload: {
          channel: 'test-channel',
          recipient: 'user-456',
          content: 'Olá, mundo!',
          contentType: 'text'
        }
      };
      
      webSocketService.broadcast = jest.fn();
      
      // Act
      await webSocketService.processarMensagem(ws, JSON.stringify(mensagem));
      
      // Assert
      expect(mockMessageService.saveMessage).toHaveBeenCalledTimes(1);
      expect(mockMessageService.saveMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'test-channel',
          sender: 'user-123',
          recipient: 'user-456',
          content: 'Olá, mundo!'
        })
      );
      
      expect(webSocketService.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'NEW_MESSAGE'
        }),
        'test-channel'
      );
    });
    
    it('deve rejeitar mensagem de cliente não autenticado', async () => {
      // Arrange
      const ws = { 
        id: 'conn-123', 
        isAuthenticated: false,
        send: jest.fn()
      };
      
      const mensagem = {
        type: 'MESSAGE',
        payload: {
          channel: 'test-channel',
          content: 'Mensagem não autorizada'
        }
      };
      
      // Act
      await webSocketService.processarMensagem(ws, JSON.stringify(mensagem));
      
      // Assert
      expect(mockMessageService.saveMessage).not.toHaveBeenCalled();
      expect(ws.send).toHaveBeenCalledWith(
        expect.stringContaining('ERROR')
      );
    });
  });
  
  describe('lidarComHistorico', () => {
    it('deve buscar histórico de mensagens para canal e usuário específicos', async () => {
      // Arrange
      const ws = { 
        id: 'conn-123', 
        userId: 'user-123', 
        isAuthenticated: true,
        send: jest.fn()
      };
      
      const mensagem = {
        type: 'GET_HISTORY',
        payload: {
          conversationId: 'conv-123',
          limit: 10
        }
      };
      
      // Act
      await webSocketService.lidarComHistorico(ws, mensagem);
      
      // Assert
      expect(mockMessageService.getConversationHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-123',
          limit: 10
        })
      );
      
      expect(ws.send).toHaveBeenCalledWith(
        expect.stringContaining('HISTORY_RESULT')
      );
    });
  });
  
  describe('broadcast', () => {
    it('deve enviar mensagem para todos os clientes em um canal', () => {
      // Arrange
      const mensagem = { type: 'TEST', payload: { data: 'teste' } };
      const canal = 'test-channel';
      
      const client1 = { 
        id: 'conn-1', 
        isAuthenticated: true, 
        channels: [canal],
        readyState: WebSocket.OPEN,
        send: jest.fn()
      };
      
      const client2 = { 
        id: 'conn-2', 
        isAuthenticated: true, 
        channels: [canal],
        readyState: WebSocket.OPEN,
        send: jest.fn()
      };
      
      const client3 = { 
        id: 'conn-3', 
        isAuthenticated: true, 
        channels: ['outro-canal'],
        readyState: WebSocket.OPEN,
        send: jest.fn()
      };
      
      // Simulando clientes conectados
      webSocketService.clients = [client1, client2, client3];
      
      // Act
      webSocketService.broadcast(mensagem, canal);
      
      // Assert
      expect(client1.send).toHaveBeenCalledWith(JSON.stringify(mensagem));
      expect(client2.send).toHaveBeenCalledWith(JSON.stringify(mensagem));
      expect(client3.send).not.toHaveBeenCalled();
    });
  });
});
