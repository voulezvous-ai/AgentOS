/**
 * Ponto de entrada do serviço WhatsApp
 * Inicializa o servidor Express, WebSocket e outros componentes
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { createTerminus } = require('@godaddy/terminus');

const config = require('./config/config');
const { logger, httpLogger } = require('./utils/logger');
const whatsappService = require('./services/whatsappService');
const websocketService = require('./services/websocketService');
const routes = require('./routes');

// Cria aplicação Express
const app = express();

// Configura middlewares
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: config.app.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(httpLogger);

// Configura logs de requisição em ambiente de desenvolvimento
if (config.app.env === 'development') {
  app.use(morgan('dev'));
}

// Configura rotas estáticas para arquivos de mídia
app.use('/media', express.static(path.join(__dirname, '..', config.whatsapp.mediaDir)));

// Configura rotas da API
app.use(config.app.apiPrefix, routes);

// Rota de status para healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: config.app.name,
    timestamp: new Date().toISOString(),
  });
});

// Rota padrão
app.get('/', (req, res) => {
  res.status(200).json({
    service: config.app.name,
    version: process.env.npm_package_version || '1.0.0',
    status: 'running',
  });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  logger.error(`Erro na requisição: ${err.message}`, { error: err });
  
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500,
    },
  });
});

// Middleware para rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Rota não encontrada',
      status: 404,
    },
  });
});

// Cria servidor HTTP
const server = http.createServer(app);

// Função para conectar ao MongoDB
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info(`Conectado ao MongoDB: ${config.mongodb.uri}`);
    return true;
  } catch (error) {
    logger.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    return false;
  }
};

// Função para iniciar o servidor
const startServer = async () => {
  try {
    // Conecta ao MongoDB
    const mongoConnected = await connectToMongoDB();
    
    if (!mongoConnected) {
      throw new Error('Falha ao conectar ao MongoDB');
    }
    
    // Inicializa serviço WebSocket
    websocketService.initialize(server);
    
    // Inicializa serviço WhatsApp
    await whatsappService.initialize();
    
    // Inicia o servidor
    const port = config.app.port;
    const host = config.app.host;
    
    server.listen(port, host, () => {
      logger.info(`Servidor rodando em http://${host}:${port}`);
      logger.info(`Ambiente: ${config.app.env}`);
    });
    
    // Configuração do Terminus para encerramento gracioso
    createTerminus(server, {
      signal: 'SIGINT',
      timeout: config.app.shutdownTimeout,
      healthChecks: {
        '/health': async () => {
          return { status: 'ok' };
        },
      },
      onSignal: async () => {
        logger.info('Servidor recebeu sinal de encerramento');
        
        // Encerra conexões WebSocket
        websocketService.shutdown();
        
        // Encerra clientes WhatsApp
        await whatsappService.shutdown();
        
        // Fecha conexão com MongoDB
        await mongoose.connection.close();
        logger.info('Conexão com MongoDB fechada');
      },
      onShutdown: async () => {
        logger.info('Servidor encerrado com sucesso');
      },
    });
    
    return true;
  } catch (error) {
    logger.error(`Erro ao iniciar servidor: ${error.message}`);
    process.exit(1);
  }
};

// Inicia servidor se executado diretamente
if (require.main === module) {
  startServer();
}

// Exporta para testes e outros usos
module.exports = {
  app,
  server,
  startServer,
};
