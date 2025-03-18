/**
 * Servidor principal para o serviço WebSocket do AgentOS
 * Implementa uma arquitetura modular com melhor gerenciamento de Change Streams
 */

// Importações de módulos
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

// Importações internas
const { logger, httpLogStream } = require('./utils/logger');
const WebSocketService = require('./services/websocketService');
const ChangeStreamMonitor = require('./utils/changeStreamMonitor');
const messageController = require('./controllers/messageController');
const { setupGracefulShutdown } = require('./utils/gracefulShutdown');
const { WS_PORT } = require('./config/websocket');

// Inicializar o aplicativo Express
const app = express();
const port = process.env.PORT || WS_PORT;

// Aplicar middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: httpLogStream }));

// Rota de status do servidor
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    service: 'WebSocket Service',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Criar servidor HTTP
const server = http.createServer(app);

// Inicializar monitor de Change Streams
const changeStreamMonitor = new ChangeStreamMonitor();

/**
 * Função principal para inicializar o servidor
 */
async function startServer() {
  try {
    logger.info(`Inicializando WebSocket Service na porta ${port}...`);
    
    // Conectar ao MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agentos';
    
    logger.info(`Conectando ao MongoDB: ${mongoURI}`);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Se estiver em um ambiente de produção ou com replica set, habilitar retryWrites
      retryWrites: process.env.NODE_ENV === 'production' || process.env.MONGO_REPLICA_SET_NAME ? true : false
    });
    
    logger.info('Conexão com MongoDB estabelecida');
    
    // Inicializar monitor de Change Streams
    changeStreamMonitor
      .initialize(mongoose.connection)
      .startMonitoring(messageController.getActiveStreams(), 60000);
    
    // Configurar diagnósticos de Change Streams
    changeStreamMonitor.setupDiagnostics(app, messageController);
    
    // Inicializar serviço WebSocket
    const websocketService = new WebSocketService(server);
    websocketService.initialize();
    
    // Configurar desligamento gracioso
    setupGracefulShutdown(server, websocketService, mongoose);
    
    // Iniciar o servidor
    server.listen(port, () => {
      logger.info(`Servidor WebSocket iniciado na porta ${port}`);
    });
    
    return {
      app,
      server,
      mongoose,
      websocketService,
      changeStreamMonitor
    };
  } catch (error) {
    logger.error('Erro ao inicializar o servidor:', error);
    process.exit(1);
  }
}

// Se este arquivo for executado diretamente, inicia o servidor
if (require.main === module) {
  startServer();
}

// Exportar para uso em testes ou pelo cluster
module.exports = {
  startServer,
  app,
  server
};
