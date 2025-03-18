/**
 * Aplicação principal do Serviço de Auditoria
 * Responsável por fornecer visualização e gestão de logs de auditoria
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { errorHandler } = require('../../common/utils/errorHandler');
const logger = require('../../common/config/logger');
const { createAuditMiddleware } = require('../../common/middleware/auditMiddleware');
const routes = require('./routes');

// Inicializar aplicação Express
const app = express();

// Conectar ao MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agentos', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(() => {
    logger.info('Conexão com MongoDB estabelecida');
  })
  .catch((err) => {
    logger.error(`Erro ao conectar ao MongoDB: ${err.message}`);
    process.exit(1);
  });

// Middleware de segurança
app.use(helmet());

// CORS
app.use(cors());

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging HTTP
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Middleware de auditoria para autologar requisições/respostas
app.use(createAuditMiddleware('audit-service', {
  logAllResponses: true,
  performanceTracking: true
}));

// Rotas
app.use('/api/audit', routes);

// Rota principal
app.get('/', (req, res) => {
  res.json({
    service: 'Audit Service',
    status: 'running',
    version: '1.0.0'
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Handler de erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  // Encerrar processo em caso de erro não tratado
  process.exit(1);
});

// Iniciar servidor
const PORT = process.env.PORT || 3050;
app.listen(PORT, () => {
  logger.info(`Serviço de Auditoria rodando na porta ${PORT}`);
});

module.exports = app;
