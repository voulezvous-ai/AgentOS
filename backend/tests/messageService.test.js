/**
 * Testes para o serviço de mensagens
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { MessageService } = require('../src/services/messageService');
const { MessageRepository } = require('../src/repositories/messageRepository');
const Message = require('../src/models/Message');

// Mock para o logger
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('MessageService', () => {
  let mongoServer;
  let messageService;
  let messageRepository;
  
  // Configuração antes de todos os testes
  beforeAll(async () => {
    // Iniciar MongoDB em memória para testes
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Conectar ao MongoDB em memória
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Inicializar repositório e serviço
    messageRepository = new MessageRepository(Message);
    messageService = new MessageService(messageRepository);
  });
  
  // Limpar dados entre testes
  afterEach(async () => {
    await Message.deleteMany({});
  });
  
  // Encerrar após todos os testes
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  // Dados de exemplo para testes
  const testMessage = {
    channel: 'test-channel',
    conversationId: 'conv-123',
    sender: 'user-123',
    senderName: 'Test User',
    recipient: 'user-456',
    content: 'Mensagem de teste',
    contentType: 'text'
  };
  
  describe('saveMessage', () => {
    it('deve salvar uma mensagem corretamente', async () => {
      // Act
      const savedMessage = await messageService.saveMessage(testMessage);
      
      // Assert
      expect(savedMessage).toBeDefined();
      expect(savedMessage._id).toBeDefined();
      expect(savedMessage.channel).toBe(testMessage.channel);
      expect(savedMessage.sender).toBe(testMessage.sender);
      expect(savedMessage.content).toBe(testMessage.content);
      
      // Verificar se a mensagem foi realmente salva no banco
      const foundMessage = await Message.findById(savedMessage._id);
      expect(foundMessage).toBeDefined();
      expect(foundMessage.channel).toBe(testMessage.channel);
    });
    
    it('deve rejeitar mensagens sem campos obrigatórios', async () => {
      // Arrange
      const invalidMessage = {
        content: 'Mensagem sem campos obrigatórios'
      };
      
      // Act & Assert
      await expect(messageService.saveMessage(invalidMessage))
        .rejects.toThrow();
    });
  });
  
  describe('getConversationHistory', () => {
    beforeEach(async () => {
      // Criar mensagens de teste para a conversa
      const messages = [
        {
          ...testMessage,
          createdAt: new Date('2023-01-01T10:00:00Z')
        },
        {
          ...testMessage,
          content: 'Segunda mensagem',
          createdAt: new Date('2023-01-01T10:05:00Z')
        },
        {
          ...testMessage,
          content: 'Terceira mensagem',
          createdAt: new Date('2023-01-01T10:10:00Z')
        }
      ];
      
      await Message.insertMany(messages);
    });
    
    it('deve retornar o histórico da conversa em ordem cronológica', async () => {
      // Act
      const history = await messageService.getConversationHistory({
        conversationId: testMessage.conversationId
      });
      
      // Assert
      expect(history).toBeDefined();
      expect(history.length).toBe(3);
      expect(history[0].content).toBe(testMessage.content);
      expect(history[1].content).toBe('Segunda mensagem');
      expect(history[2].content).toBe('Terceira mensagem');
    });
    
    it('deve aplicar paginação corretamente', async () => {
      // Act
      const history = await messageService.getConversationHistory({
        conversationId: testMessage.conversationId,
        limit: 2,
        skip: 1
      });
      
      // Assert
      expect(history).toBeDefined();
      expect(history.length).toBe(2);
      expect(history[0].content).toBe('Segunda mensagem');
      expect(history[1].content).toBe('Terceira mensagem');
    });
  });
  
  describe('markMessagesAsRead', () => {
    let savedMessages;
    
    beforeEach(async () => {
      // Criar mensagens de teste não lidas
      const messages = [
        {
          ...testMessage,
          readStatus: { isRead: false, readAt: null }
        },
        {
          ...testMessage,
          content: 'Segunda mensagem',
          readStatus: { isRead: false, readAt: null }
        }
      ];
      
      savedMessages = await Message.insertMany(messages);
    });
    
    it('deve marcar mensagens como lidas', async () => {
      // Arrange
      const messageIds = savedMessages.map(msg => msg._id.toString());
      
      // Act
      const result = await messageService.markMessagesAsRead({
        messageIds,
        userId: 'user-456'
      });
      
      // Assert
      expect(result.modifiedCount).toBe(2);
      
      // Verificar se as mensagens foram realmente marcadas como lidas
      const updatedMessages = await Message.find({
        _id: { $in: messageIds }
      });
      
      expect(updatedMessages.length).toBe(2);
      expect(updatedMessages[0].readStatus.isRead).toBe(true);
      expect(updatedMessages[0].readStatus.readAt).toBeDefined();
      expect(updatedMessages[1].readStatus.isRead).toBe(true);
      expect(updatedMessages[1].readStatus.readAt).toBeDefined();
    });
  });
  
  describe('getUnreadMessagesCount', () => {
    beforeEach(async () => {
      // Criar mensagens de teste lidas e não lidas
      const messages = [
        {
          ...testMessage,
          readStatus: { isRead: false, readAt: null }
        },
        {
          ...testMessage,
          content: 'Mensagem lida',
          readStatus: { isRead: true, readAt: new Date() }
        },
        {
          ...testMessage,
          content: 'Outra não lida',
          readStatus: { isRead: false, readAt: null }
        }
      ];
      
      await Message.insertMany(messages);
    });
    
    it('deve retornar a contagem correta de mensagens não lidas', async () => {
      // Act
      const count = await messageService.getUnreadMessagesCount({
        recipient: testMessage.recipient
      });
      
      // Assert
      expect(count).toBe(2);
    });
  });
});
