/**
 * Utilitário para desligamento gracioso do servidor WebSocket
 * Garante que todas as conexões sejam encerradas adequadamente
 */

const { logger } = require('./logger');

/**
 * Configura o desligamento gracioso
 * @param {Object} server - Servidor HTTP
 * @param {Object} websocketService - Serviço WebSocket
 * @param {Object} mongoClient - Cliente do MongoDB
 */
function setupGracefulShutdown(server, websocketService, mongoClient) {
  let shuttingDown = false;
  
  const shutdown = async (signal) => {
    try {
      if (shuttingDown) return;
      shuttingDown = true;
      
      logger.info(`Received shutdown signal: ${signal}`);
      logger.info('Starting graceful shutdown...');
      
      // Definir timeout para forçar o encerramento se demorar muito
      // Se o desligamento gracioso não terminar em 15 segundos, forçamos o encerramento
      const forceTimeout = setTimeout(() => {
        logger.error('Graceful shutdown timed out, forcing exit');
        process.exit(1);
      }, 15000);
      
      // Parar de aceitar novas conexões
      if (server) {
        logger.info('Closing HTTP server...');
        server.close(() => {
          logger.info('HTTP server closed successfully');
        });
      }
      
      // Encerrar serviço WebSocket
      if (websocketService) {
        logger.info('Shutting down WebSocket service...');
        websocketService.shutdown();
        logger.info('WebSocket service shut down successfully');
      }
      
      // Fechar conexão com o MongoDB
      if (mongoClient) {
        logger.info('Closing MongoDB connection...');
        await mongoClient.connection.close(false);
        logger.info('MongoDB connection closed successfully');
      }
      
      // Limpar timeout e sair normalmente
      clearTimeout(forceTimeout);
      logger.info('Graceful shutdown completed');
      
      // Aguardar um momento para que os logs sejam gravados
      setTimeout(() => {
        process.exit(0);
      }, 500);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };
  
  // Registrar handlers para sinais de terminação
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdown('uncaughtException');
  });
  
  logger.info('Graceful shutdown handlers configured');
}

module.exports = { setupGracefulShutdown };
