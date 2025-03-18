/**
 * Script de diagnóstico para o serviço WebSocket
 * Verifica a configuração e conectividade com MongoDB, Change Streams e WebSocket
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');
const ChangeStreamMonitor = require('../utils/changeStreamMonitor');

// MongoDB URI
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agentos';

/**
 * Verifica a conexão com o MongoDB
 * @returns {Promise<boolean>} Status da conexão
 */
async function checkMongoDBConnection() {
  try {
    logger.info('Verificando conexão com MongoDB...');
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const admin = mongoose.connection.db.admin();
    const buildInfo = await admin.buildInfo();
    
    logger.info(`Conectado ao MongoDB versão ${buildInfo.version}`);
    logger.info(`URI de conexão: ${mongoURI}`);
    
    return true;
  } catch (error) {
    logger.error('Erro ao conectar ao MongoDB:', error);
    return false;
  }
}

/**
 * Verifica a configuração de Replica Set para suporte a Change Streams
 * @returns {Promise<Object>} Resultado da verificação
 */
async function checkReplicaSetConfiguration() {
  try {
    logger.info('Verificando configuração de Replica Set...');
    
    const admin = mongoose.connection.db.admin();
    
    // Tentar obter status do replica set
    try {
      const rs = await admin.command({ replSetGetStatus: 1 });
      
      logger.info('MongoDB está configurado como Replica Set:');
      logger.info(`  - Nome: ${rs.set}`);
      logger.info(`  - Status: ${rs.ok === 1 ? 'OK' : 'Com problemas'}`);
      logger.info(`  - Membros: ${rs.members.length}`);
      
      // Verificar saúde dos membros
      const primaryCount = rs.members.filter(m => m.state === 1).length;
      const secondaryCount = rs.members.filter(m => m.state === 2).length;
      
      logger.info(`  - Primários: ${primaryCount}`);
      logger.info(`  - Secundários: ${secondaryCount}`);
      
      return {
        isReplicaSet: true,
        status: rs.ok === 1 ? 'healthy' : 'unhealthy',
        name: rs.set,
        members: rs.members.length,
        primaryCount,
        secondaryCount
      };
    } catch (rsError) {
      // Verificar se é um sharded cluster
      try {
        const shards = await admin.command({ listShards: 1 });
        
        if (shards.ok === 1) {
          logger.info('MongoDB está configurado como Sharded Cluster:');
          logger.info(`  - Shards: ${shards.shards.length}`);
          
          return {
            isReplicaSet: false,
            isShardedCluster: true,
            status: 'healthy',
            shards: shards.shards.length
          };
        }
      } catch (shardError) {
        logger.warn('MongoDB não está configurado como Replica Set ou Sharded Cluster');
        logger.warn('Change Streams requerem Replica Set ou Sharded Cluster');
        
        return {
          isReplicaSet: false,
          isShardedCluster: false,
          status: 'standalone',
          warning: 'Change Streams não são suportados nesta configuração'
        };
      }
    }
  } catch (error) {
    logger.error('Erro ao verificar configuração de Replica Set:', error);
    
    return {
      isReplicaSet: false,
      isShardedCluster: false,
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Verifica se Change Streams são suportados
 * @returns {Promise<Object>} Resultado do teste
 */
async function testChangeStreams() {
  try {
    logger.info('Testando suporte a Change Streams...');
    
    const monitor = new ChangeStreamMonitor().initialize(mongoose.connection);
    const result = await monitor.testChangeStreamCompatibility();
    
    if (result.success) {
      logger.info('Change Streams são totalmente suportados neste ambiente');
    } else {
      logger.warn(`Change Streams não são suportados: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    logger.error('Erro ao testar Change Streams:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Exibe relatório de diagnóstico
 * @param {Object} results Resultados dos testes
 */
function printDiagnosticReport(results) {
  logger.info('\n===== RELATÓRIO DE DIAGNÓSTICO =====');
  logger.info(`Data: ${new Date().toISOString()}`);
  logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`MongoDB URI: ${mongoURI}`);
  
  // MongoDB Connection
  logger.info('\n--- Conexão MongoDB ---');
  logger.info(`Status: ${results.mongoConnection ? 'Conectado' : 'Falhou'}`);
  
  // Replica Set
  logger.info('\n--- Configuração Replica Set ---');
  logger.info(`Tipo: ${results.replicaSet.isReplicaSet ? 'Replica Set' : 
    (results.replicaSet.isShardedCluster ? 'Sharded Cluster' : 'Standalone')}`);
  logger.info(`Status: ${results.replicaSet.status}`);
  
  if (results.replicaSet.isReplicaSet) {
    logger.info(`Nome: ${results.replicaSet.name}`);
    logger.info(`Membros: ${results.replicaSet.members}`);
    logger.info(`Primários: ${results.replicaSet.primaryCount}`);
    logger.info(`Secundários: ${results.replicaSet.secondaryCount}`);
  }
  
  // Change Streams
  logger.info('\n--- Suporte a Change Streams ---');
  logger.info(`Suportado: ${results.changeStreams.success ? 'Sim' : 'Não'}`);
  
  if (!results.changeStreams.success && results.changeStreams.error) {
    logger.info(`Motivo: ${results.changeStreams.error}`);
  }
  
  logger.info('\n=================================\n');
}

/**
 * Função principal
 */
async function main() {
  try {
    logger.info('Iniciando diagnóstico do WebSocket Service...');
    
    // Verificar conexão com MongoDB
    const mongoConnection = await checkMongoDBConnection();
    
    if (!mongoConnection) {
      logger.error('Não foi possível conectar ao MongoDB. Abortando diagnóstico.');
      process.exit(1);
    }
    
    // Verificar Replica Set
    const replicaSet = await checkReplicaSetConfiguration();
    
    // Testar Change Streams
    const changeStreams = await testChangeStreams();
    
    // Exibir relatório
    printDiagnosticReport({
      mongoConnection,
      replicaSet,
      changeStreams
    });
    
    // Fechar conexão
    await mongoose.connection.close();
    logger.info('Diagnóstico concluído.');
    
    // Verificar se tudo está OK
    if (mongoConnection && 
        (replicaSet.isReplicaSet || replicaSet.isShardedCluster) && 
        changeStreams.success) {
      logger.info('RESULTADO: Ambiente está corretamente configurado para o WebSocket Service.');
      process.exit(0);
    } else {
      logger.warn('RESULTADO: Ambiente possui problemas de configuração. Verifique o relatório.');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Erro durante diagnóstico:', error);
    
    // Garantir que a conexão seja fechada
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// Executar diagnóstico
main();
