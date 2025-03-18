/**
 * Servidor WebSocket centralizado para o AgentOS
 * Suporta múltiplos canais de comunicação (VOX, chat de estafetas, etc.)
 * Utiliza MongoDB Change Streams para notificações em tempo real
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { connectDB, supportsChangeStreams } = require('../../config/mongodb');
const messageController = require('./controllers/messageController');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { monitorChangeStreams, setupChangeStreamDiagnostics } = require('./utils/changeStreamMonitor');

// Configurações
const PORT = process.env.PORT || 3002;
const app = express();
const server = http.createServer(app);

// Conectar ao MongoDB
connectDB();

// Middleware básico
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet()); // Segurança para cabeçalhos HTTP
app.use(compression()); // Compressão de respostas
app.use(express.json({ limit: '1mb' })); // Limite para payload JSON
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Servidor WebSocket
const wss = new WebSocket.Server({ server });

// Clientes conectados por canal
const channels = {
  vox: new Map(),
  couriers: new Map()
};

// Quando um cliente conecta
wss.on('connection', async (ws, req) => {
  const clientId = uuidv4();
  let channel = 'vox'; // Canal padrão
  let userId = null;
  
  console.log(`Nova conexão estabelecida: ${clientId}`);
  
  // Determinar canal a partir da URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  if (pathname.includes('/api/vox/ws')) {
    channel = 'vox';
  } else if (pathname.includes('/api/chat/couriers')) {
    channel = 'couriers';
  }
  
  // Armazenar cliente no canal apropriado
  channels[channel].set(clientId, { ws, metadata: {}, userId: null });
  
  console.log(`Novo cliente conectado ao canal ${channel}: ${clientId}`);
  
  // Enviar mensagem de boas-vindas
  ws.send(JSON.stringify({
    type: 'connection_established',
    clientId,
    channel,
    timestamp: new Date().toISOString()
  }));
  
  // Configurar o Change Stream para o canal, se ainda não estiver ativo
  try {
    await messageController.setupChangeStream(channel, (messageData) => {
      // Esta função de callback é acionada quando o Change Stream detecta uma alteração
      console.log(`Notificando clientes do canal ${channel} sobre nova mensagem:`, messageData.id);
      
      // Prepara mensagem de notificação
      const notification = {
        type: 'realtime_update',
        source: 'change_stream',
        data: messageData,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast para o canal
      broadcastToChannel(channel, JSON.stringify(notification));
    });
    console.log(`Change Stream configurado para o canal ${channel}`);
  } catch (error) {
    console.error(`Erro ao configurar Change Stream para o canal ${channel}:`, error);
  }
  
  // Quando recebe uma mensagem
  ws.on('message', async (message) => {
    console.log(`Mensagem recebida do cliente ${clientId}: ${message}`);
    
    try {
      const data = JSON.parse(message);
      
      // Processar operações de autenticação e metadados
      if (data.type === 'auth') {
        const user = await authenticateUser(data);
        if (user) {
          channels[channel].get(clientId).metadata.userId = user.id;
          ws.send(JSON.stringify({
            type: 'auth_success',
            userId: user.id
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'auth_error',
            error: 'Falha na autenticação'
          }));
        }
        return;
      }
      
      // Manipular diferentes tipos de mensagens com base no canal
      if (channel === 'vox') {
        handleVoxMessage(clientId, data);
      } else if (channel === 'couriers') {
        handleCourierMessage(clientId, data);
      }
      
      // Eco da mensagem (remover ou modificar conforme necessário)
      ws.send(JSON.stringify({
        type: 'echo',
        original: data,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error(`Erro ao processar mensagem de ${clientId}:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Erro ao processar mensagem',
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  // Quando o cliente desconecta
  ws.on('close', () => {
    console.log(`Cliente desconectado do canal ${channel}: ${clientId}`);
    channels[channel].delete(clientId);
    
    // Se não houver mais clientes no canal, fechar o Change Stream
    if (channels[channel].size === 0) {
      messageController.closeChangeStream(channel);
      console.log(`Fechando Change Stream do canal ${channel} (sem clientes ativos)`);
    }
  });
  
  // Tratamento de erros de conexão
  ws.on('error', (error) => {
    console.error(`Erro na conexão com cliente ${clientId}:`, error);
    channels[channel].delete(clientId);
  });
});

/**
 * Envia mensagem para todos os clientes de um canal
 * @param {string} channel - Canal para broadcast
 * @param {Object} message - Mensagem a enviar
 */
function broadcastToChannel(channel, message) {
  const clients = channels[channel] || new Map();
  let count = 0;
  
  clients.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      count++;
    }
  });
  
  console.log(`Mensagem enviada para ${count} clientes no canal ${channel}`);
}

/**
 * Envia mensagem para um cliente específico ou canal
 * @param {string} targetUserId - ID do usuário destinatário (null para todos)
 * @param {string} message - Mensagem a enviar
 * @param {string} channel - Canal para broadcast se targetUserId for null
 */
function broadcast(targetUserId, message, channel = 'vox') {
  if (targetUserId) {
    // Enviar para um usuário específico
    let sent = false;
    for (const [chanName, clients] of Object.entries(channels)) {
      for (const [clientId, client] of clients.entries()) {
        if (client.userId === targetUserId && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message);
          sent = true;
        }
      }
    }
    return sent;
  } else {
    // Broadcast para um canal
    broadcastToChannel(channel, JSON.parse(message));
    return true;
  }
}

/**
 * Trata mensagens específicas do canal VOX
 */
async function handleVoxMessage(clientId, data) {
  const client = channels.vox.get(clientId);
  
  if (!client || !client.userId) return;
  
  // Processar a mensagem com o controlador
  try {
    data.channel = 'vox';
    const userId = client.userId;
    
    switch (data.type) {
      case 'text_message':
      case 'voice_message':
        // Processar via controlador de mensagens
        await messageController.processMessage(data, userId, client.ws, broadcast);
        break;
        
      default:
        console.log(`Tipo de mensagem VOX não reconhecido: ${data.type}`);
    }
  } catch (error) {
    console.error('Erro ao processar mensagem VOX:', error);
    client.ws.send(JSON.stringify({
      type: 'error',
      message: 'Erro ao processar mensagem VOX',
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Trata mensagens específicas do canal de estafetas
 */
async function handleCourierMessage(clientId, data) {
  const client = channels.couriers.get(clientId);
  
  if (!client || !client.userId) return;
  
  // Processar a mensagem com o controlador
  try {
    data.channel = 'couriers';
    const userId = client.userId;
    
    switch (data.type) {
      case 'courier_message':
        // Processar via controlador de mensagens
        const result = await messageController.processMessage(data, userId, client.ws, broadcast);
        
        // Notificar todos no canal sobre a nova mensagem
        if (result.success) {
          broadcastToChannel('couriers', {
            type: 'new_message',
            sender: client.userId,
            content: data.content,
            id: result.message.id,
            timestamp: new Date().toISOString()
          });
        }
        break;
        
      default:
        console.log(`Tipo de mensagem de estafeta não reconhecido: ${data.type}`);
    }
  } catch (error) {
    console.error('Erro ao processar mensagem de estafeta:', error);
    client.ws.send(JSON.stringify({
      type: 'error',
      message: 'Erro ao processar mensagem de estafeta',
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Autentica um usuário (implementação básica)
 */
async function authenticateUser(data) {
  try {
    // Esta é uma implementação simplificada
    // Em produção, deve validar tokens, consultar banco de dados, etc.
    if (!data.userId) {
      console.warn('Tentativa de autenticação sem userId');
      return null;
    }
    
    // Você pode implementar verificação de token JWT aqui
    // const isValidToken = validateToken(data.token);
    // if (!isValidToken) return null;
    
    // Criar ou atualizar o usuário no banco de dados se necessário
    // await userController.updateUserStatus(data.userId, 'online');
    
    return { id: data.userId };
  } catch (error) {
    console.error('Erro na autenticação do usuário:', error);
    return null;
  }
}

// Rota para obter histórico de conversas
app.get('/api/chat/history/:channel', async (req, res) => {
  try {
    const channel = req.params.channel;
    const limit = parseInt(req.query.limit) || 50;
    
    if (!['vox', 'couriers'].includes(channel)) {
      return res.status(400).json({ error: 'Canal inválido' });
    }
    
    const history = await messageController.getChannelHistory(channel, limit);
    res.json({ success: true, messages: history });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar histórico' });
  }
});

// Rota para obter mensagens diretas entre usuários
app.get('/api/chat/direct/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const messages = await messageController.getDirectMessages(userId1, userId2, limit);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Erro ao buscar mensagens diretas:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar mensagens diretas' });
  }
});

// Rota de status (para health checks)
app.get('/status', async (req, res) => {
  const changeStreamsSupported = await supportsChangeStreams();
  
  res.json({ 
    status: 'ok', 
    connections: {
      vox: channels.vox.size,
      couriers: channels.couriers.size
    },
    features: {
      changeStreams: {
        supported: changeStreamsSupported,
        active: Object.keys(messageController).includes('setupChangeStream') && changeStreamsSupported
      }
    },
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid
  });
});

// Configurar diagnóstico de Change Streams
setupChangeStreamDiagnostics(app, messageController.getActiveChangeStreams ? messageController.getActiveChangeStreams() : {});

// Iniciar monitoramento de Change Streams
let changeStreamMonitor;
supportsChangeStreams().then(supported => {
  if (supported && messageController.getActiveChangeStreams) {
    console.log('Iniciando monitoramento de Change Streams...');
    changeStreamMonitor = monitorChangeStreams(messageController.getActiveChangeStreams(), 30000);
    changeStreamMonitor.start();
  } else if (!supported) {
    console.warn('Monitoramento de Change Streams desativado - MongoDB não está em modo Replica Set');
  }
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor WebSocket rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT}/status para verificar o status`);
  
  // Verificar suporte a Change Streams
  supportsChangeStreams().then(supported => {
    if (supported) {
      console.log('MongoDB está configurado para Change Streams (Replica Set detectado)');
    } else {
      console.warn('AVISO: MongoDB não está em modo Replica Set - Change Streams terão funcionalidade limitada!');
    }
  });
});

// Gerenciar encerramento limpo do servidor
process.on('SIGINT', async () => {
  console.log('Encerrando servidor WebSocket...');
  
  // Parar monitoramento de Change Streams
  if (changeStreamMonitor) {
    changeStreamMonitor.stop();
  }
  
  // Fechar todos os Change Streams
  if (messageController.closeAllChangeStreams) {
    messageController.closeAllChangeStreams();
  }
  
  // Fechar todas as conexões WebSocket
  wss.clients.forEach(client => {
    client.terminate();
  });
  
  // Fechar servidor HTTP
  server.close(() => {
    console.log('Servidor HTTP fechado.');
    process.exit(0);
  });
});
