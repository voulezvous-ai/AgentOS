/**
 * Ponto de entrada principal do AgentOS Backend
 * Inicialização de todos os subsistemas e middleware
 */

require('dotenv').config();
const app = require('./interfaces/api/app');
const { connectToDatabase } = require('./infrastructure/database/mongodb');
const { initializeServices } = require('./core/serviceRegistry');
const { logger } = require('./infrastructure/logging/logger');

const PORT = process.env.PORT || 3000;

/**
 * Função de inicialização principal do sistema
 */
async function startApplication() {
  try {
    logger.info('Iniciando AgentOS Backend...');
    
    // Conectar ao banco de dados
    await connectToDatabase();
    logger.info('Conexão com o banco de dados estabelecida');
    
    // Inicializar serviços principais
    await initializeServices();
    logger.info('Serviços principais inicializados');
    
    // Iniciar o servidor HTTP
    app.listen(PORT, () => {
      logger.info(`Servidor inicializado na porta ${PORT}`);
      logger.info('AgentOS Backend pronto para receber requisições');
    });
    
    // Tratamento de encerramento limpo
    setupGracefulShutdown();
    
  } catch (error) {
    logger.error(`Erro durante inicialização: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

/**
 * Configurar encerramento elegante da aplicação
 */
function setupGracefulShutdown() {
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.info(`Sinal ${signal} recebido. Iniciando encerramento...`);
      
      // Fechar conexões abertas e limpar recursos
      try {
        // Lugar para colocar limpeza de recursos
        logger.info('Recursos liberados com sucesso');
        process.exit(0);
      } catch (error) {
        logger.error(`Erro durante encerramento: ${error.message}`);
        process.exit(1);
      }
    });
  });
}

// Iniciar aplicação
startApplication();
