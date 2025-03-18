/**
 * Utilitário para monitorar e diagnosticar o funcionamento dos MongoDB Change Streams
 * 
 * Este módulo fornece ferramentas para verificar se o MongoDB está configurado
 * corretamente para suportar Change Streams e monitorar a integridade dos streams
 */

const { logger } = require('./logger');

/**
 * Classe para monitorar a saúde de Change Streams
 */
class ChangeStreamMonitor {
  /**
   * Inicializa o monitor
   * @param {Object} dbConnection - Conexão com o MongoDB
   */
  constructor(dbConnection) {
    this.db = dbConnection;
    this.monitorInterval = null;
    this.mongoClient = null;
    this.isSupported = false;
  }

  /**
   * Inicializa o monitor com a conexão MongoDB
   * @param {Object} mongoClient - Cliente MongoDB
   */
  initialize(mongoClient) {
    this.mongoClient = mongoClient;
    return this;
  }

  /**
   * Monitora a saúde de todos os Change Streams ativos
   * @param {Object} changeStreams - Objeto contendo os change streams ativos
   * @param {Number} intervalMs - Intervalo em ms para verificação
   * @returns {Object} Controlador do monitor
   */
  startMonitoring(changeStreams, intervalMs = 60000) {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    
    this.monitorInterval = setInterval(async () => {
      try {
        this.isSupported = await this.supportsChangeStreams();
        
        if (!this.isSupported) {
          logger.warn('AVISO: Ambiente atual não suporta Change Streams!');
          return;
        }
        
        const channels = Object.keys(changeStreams);
        logger.info(`Monitorando ${channels.length} Change Streams ativos...`);
        
        for (const channel of channels) {
          const stream = changeStreams[channel];
          if (!stream) continue;
          
          // Verificar se o stream está fechado
          if (stream.isClosed()) {
            logger.error(`Change Stream para ${channel} está fechado! Tentando recriar...`);
            // O serviço de mensagens deve lidar com a recriação
          }
        }
      } catch (error) {
        logger.error('Erro durante monitoramento de change streams:', error);
      }
    }, intervalMs);
    
    logger.info(`Monitor de Change Streams iniciado com intervalo de ${intervalMs}ms`);
    return this;
  }

  /**
   * Para o monitoramento de Change Streams
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      logger.info('Monitor de Change Streams parado');
    }
  }

  /**
   * Verifica se o ambiente atual suporta Change Streams
   * @returns {Promise<boolean>} true se Change Streams é suportado
   */
  async supportsChangeStreams() {
    try {
      if (!this.mongoClient) {
        logger.error('MongoDB client não inicializado para verificação de Change Streams');
        return false;
      }
      
      // Verificar se estamos conectados a um Replica Set ou Sharded Cluster
      const adminDb = this.mongoClient.db('admin');
      const status = await adminDb.command({ replSetGetStatus: 1 }).catch(() => null);
      
      if (status && status.ok === 1) {
        logger.debug('MongoDB está configurado como Replica Set, suporte a Change Streams disponível');
        return true;
      }
      
      // Verificar se é um sharded cluster
      const shardStatus = await adminDb.command({ listShards: 1 }).catch(() => null);
      if (shardStatus && shardStatus.ok === 1) {
        logger.debug('MongoDB está configurado como Sharded Cluster, suporte a Change Streams disponível');
        return true;
      }
      
      logger.warn('MongoDB não está configurado como Replica Set ou Sharded Cluster, Change Streams não disponível');
      return false;
    } catch (error) {
      logger.error('Erro ao verificar suporte a Change Streams:', error);
      return false;
    }
  }

  /**
   * Testa a compatibilidade de Change Streams no ambiente atual
   * @returns {Promise<Object>} Resultado do teste
   */
  async testChangeStreamCompatibility() {
    try {
      // Verificar se temos conexão com MongoDB
      if (!this.mongoClient || !this.mongoClient.isConnected()) {
        return {
          success: false,
          error: 'Não conectado ao MongoDB'
        };
      }
      
      // Verificar suporte a Change Streams
      const isSupported = await this.supportsChangeStreams();
      if (!isSupported) {
        return {
          success: false,
          supported: false,
          error: 'MongoDB não está configurado para suportar Change Streams'
        };
      }
      
      // Tentar criar um change stream de teste
      let testStream;
      try {
        // Criar na coleção de sistema para não interferir com dados
        const testCollection = this.mongoClient.db('admin').collection('system.version');
        testStream = testCollection.watch();
        
        // Aguardar um breve momento para garantir que o stream foi estabelecido
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const isClosed = testStream.closed;
        if (isClosed) {
          return {
            success: false,
            supported: true,
            error: 'O stream foi criado mas fechou imediatamente'
          };
        }
      } catch (streamError) {
        return {
          success: false,
          supported: true,
          error: `Erro ao criar stream de teste: ${streamError.message}`
        };
      } finally {
        if (testStream) {
          await testStream.close();
        }
      }
      
      return {
        success: true,
        supported: true,
        message: 'Change Streams é totalmente suportado neste ambiente'
      };
    } catch (error) {
      logger.error('Erro durante teste de compatibilidade de Change Streams:', error);
      return {
        success: false,
        error: `Erro durante teste: ${error.message}`
      };
    }
  }

  /**
   * Configura endpoints para diagnóstico de Change Streams
   * @param {Object} app - Aplicação Express
   * @param {Object} messageController - Controlador de mensagens com acesso aos change streams
   */
  setupDiagnostics(app, messageController) {
    if (!app) {
      logger.error('Aplicação Express não fornecida para configuração de diagnóstico');
      return;
    }
    
    // Endpoint para verificar status geral de Change Streams
    app.get('/api/diagnostics/change-streams', async (req, res) => {
      try {
        const compatibility = await this.testChangeStreamCompatibility();
        const activeStreams = messageController.getActiveStreams();
        
        res.json({
          compatibility,
          activeStreams: activeStreams.map(stream => ({
            channel: stream.channel,
            isActive: !stream.isClosed
          })),
          monitorActive: !!this.monitorInterval
        });
      } catch (error) {
        logger.error('Erro ao fornecer diagnóstico de Change Streams:', error);
        res.status(500).json({
          error: 'Erro ao analisar status de Change Streams',
          message: error.message
        });
      }
    });
    
    // Endpoint para verificar um canal específico
    app.get('/api/diagnostics/change-streams/:channel', async (req, res) => {
      try {
        const activeStreams = messageController.getActiveStreams();
        const channelStream = activeStreams.find(s => s.channel === req.params.channel);
        
        if (!channelStream) {
          return res.status(404).json({
            error: 'Stream não encontrado para este canal'
          });
        }
        
        res.json({
          channel: req.params.channel,
          isActive: !channelStream.isClosed,
          isSupported: await this.supportsChangeStreams()
        });
      } catch (error) {
        logger.error(`Erro ao fornecer diagnóstico para canal ${req.params.channel}:`, error);
        res.status(500).json({
          error: 'Erro ao analisar status do canal',
          message: error.message
        });
      }
    });
    
    logger.info('Endpoints de diagnóstico de Change Streams configurados');
  }
}

// Exportar classe
module.exports = ChangeStreamMonitor;
