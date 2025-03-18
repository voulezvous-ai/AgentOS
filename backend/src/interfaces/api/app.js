/**
 * Configuração da aplicação Express para a API REST
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('../../infrastructure/logging/requestLogger');
const { authMiddleware } = require('./middleware/authMiddleware');

// Importar rotas
const voxRoutes = require('./routes/voxRoutes');
const auditRoutes = require('./routes/auditRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Criar aplicação Express
const app = express();

// Configurar middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de requisições HTTP
app.use(morgan('dev'));
app.use(requestLogger);

// Rotas públicas (sem autenticação)
app.use('/api/health', healthRoutes);

// Middleware de autenticação para rotas protegidas
app.use('/api', authMiddleware);

// Rotas protegidas da API
app.use('/api/vox', voxRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/media', mediaRoutes);

// Rota 404 para endpoints não encontrados
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

module.exports = app;
