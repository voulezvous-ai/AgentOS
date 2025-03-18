/**
 * Aplicação principal do AgentOS
 * Configura e inicializa o servidor, middlewares e rotas
 */
const express = require('express');
const { MongoClient } = require('mongodb');
const errorHandler = require('./infrastructure/middlewares/errorHandler');
const VoxServiceConfig = require('./infrastructure/config/VoxServiceConfig');
const VoxController = require('./infrastructure/controllers/VoxController');

// Criar aplicação Express
const app = express();

// Configurações básicas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Inicializa a aplicação
 * @param {Object} config Configuração da aplicação
 * @returns {Promise<Object>} Aplicação configurada
 */
async function initializeApp(config = {}) {
  try {
    // Conectar ao banco de dados
    const mongoClient = await connectToDatabase(config.mongoUri);
    const db = mongoClient.db(config.dbName);
    
    // Inicializar serviços e casos de uso
    const voxServices = await VoxServiceConfig.initialize({
      db,
      additionalServices: config.additionalServices
    });
    
    // Configurar controladores
    const voxController = new VoxController(
      voxServices.processCommandUseCase,
      voxServices.approveEscalationUseCase,
      voxServices.rejectEscalationUseCase,
      voxServices.getPendingEscalationsUseCase
    );
    
    // Configurar rotas
    VoxController.configureRoutes(app, '/api/vox', voxController);
    
    // Configurar rota de saúde
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0'
      });
    });
    
    // Configurar middleware de tratamento de erros
    app.use(errorHandler);
    
    return {
      app,
      mongoClient,
      db,
      ...voxServices
    };
  } catch (error) {
    console.error('Falha ao inicializar aplicação:', error);
    throw error;
  }
}

/**
 * Conecta ao banco de dados MongoDB
 * @param {string} uri URI de conexão do MongoDB
 * @returns {Promise<MongoClient>} Cliente MongoDB conectado
 */
async function connectToDatabase(uri) {
  try {
    const defaultUri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri || defaultUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    await client.connect();
    console.log('Conectado ao MongoDB com sucesso');
    return client;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    throw error;
  }
}

/**
 * Inicia o servidor HTTP
 * @param {Object} app Aplicação Express
 * @param {number} port Porta do servidor
 * @returns {Promise<Object>} Servidor HTTP
 */
function startServer(app, port = 3000) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Servidor AgentOS rodando na porta ${port}`);
      resolve(server);
    });
    
    server.on('error', (error) => {
      console.error('Erro ao iniciar servidor:', error);
      reject(error);
    });
  });
}

// Se o arquivo for executado diretamente
if (require.main === module) {
  // Carregar variáveis de ambiente
  require('dotenv').config();
  
  const port = process.env.PORT || 3000;
  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'agentos';
  
  // Inicializar e iniciar o servidor
  initializeApp({
    mongoUri,
    dbName
  })
    .then(({ app }) => startServer(app, port))
    .catch((error) => {
      console.error('Falha ao iniciar aplicação:', error);
      process.exit(1);
    });
}

module.exports = {
  initializeApp,
  startServer,
  app
};
