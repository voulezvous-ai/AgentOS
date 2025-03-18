/**
 * Configuração e conexão com MongoDB
 */
const mongoose = require('mongoose');
const { createServiceLogger } = require('../logging/logger');
const { InfrastructureError } = require('../../domain/core/exceptions');

const logger = createServiceLogger('mongodb');

// Extrair URI do MongoDB das variáveis de ambiente
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agentos';

// Opções de conexão do Mongoose
const MONGOOSE_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Estabelece conexão com o MongoDB
 * @returns {Promise<mongoose.Connection>} Conexão do Mongoose
 */
exports.connectToDatabase = async () => {
  try {
    logger.info('Conectando ao MongoDB...');
    
    // Eventos de conexão
    mongoose.connection.on('connected', () => {
      logger.info('Conectado ao MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error('Erro na conexão MongoDB:', { error: err.message });
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Desconectado do MongoDB');
    });
    
    // Manipular encerramento limpo
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Conexão MongoDB fechada devido a encerramento da aplicação');
    });
    
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI, MONGOOSE_OPTIONS);
    
    return mongoose.connection;
  } catch (error) {
    logger.error('Falha ao conectar ao MongoDB:', { 
      error: error.message, 
      stack: error.stack 
    });
    
    throw new InfrastructureError(
      'Falha ao conectar ao banco de dados',
      'DATABASE_CONNECTION_ERROR',
      { originalError: error.message }
    );
  }
};

/**
 * Fecha a conexão com o MongoDB
 * @returns {Promise<void>}
 */
exports.closeDatabaseConnection = async () => {
  try {
    logger.info('Fechando conexão com MongoDB...');
    await mongoose.connection.close();
    logger.info('Conexão MongoDB fechada com sucesso');
  } catch (error) {
    logger.error('Erro ao fechar conexão MongoDB:', { 
      error: error.message, 
      stack: error.stack 
    });
    
    throw new InfrastructureError(
      'Falha ao fechar conexão com o banco de dados',
      'DATABASE_DISCONNECT_ERROR',
      { originalError: error.message }
    );
  }
};

/**
 * Fornece uma forma unificada de lidar com erros de banco de dados
 * @param {Error} error - Erro original do MongoDB/Mongoose
 * @param {string} operation - Operação que estava sendo realizada
 * @param {string} entity - Entidade envolvida na operação
 * @returns {InfrastructureError} Erro padronizado
 */
exports.handleDatabaseError = (error, operation, entity) => {
  logger.error(`Erro de banco de dados durante ${operation} de ${entity}:`, {
    error: error.message,
    code: error.code,
    stack: error.stack
  });
  
  // Erros específicos do MongoDB
  if (error.code === 11000) {
    return new InfrastructureError(
      'Violação de chave única',
      'DATABASE_DUPLICATE_KEY',
      { entity, operation, key: Object.keys(error.keyPattern)[0] }
    );
  }
  
  // Erros de validação do Mongoose
  if (error.name === 'ValidationError') {
    return new InfrastructureError(
      'Erro de validação no banco de dados',
      'DATABASE_VALIDATION_ERROR',
      { entity, operation, validationErrors: Object.values(error.errors).map(e => e.message) }
    );
  }
  
  // Erro genérico de banco de dados
  return new InfrastructureError(
    'Erro ao acessar o banco de dados',
    'DATABASE_ERROR',
    { entity, operation, originalError: error.message }
  );
};
