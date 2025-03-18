/**
 * Utilitário para monitorar e diagnosticar o funcionamento dos MongoDB Change Streams
 * 
 * Este módulo fornece ferramentas para verificar se o MongoDB está configurado
 * corretamente para suportar Change Streams e monitorar a integridade dos streams
 */

const mongoose = require('mongoose');
const { supportsChangeStreams } = require('../../../config/mongodb');

/**
 * Monitora a saúde de todos os Change Streams ativos
 * @param {Object} changeStreams - Objeto contendo os change streams ativos
 * @param {Number} intervalMs - Intervalo em ms para verificação
 * @returns {Object} Controlador do monitor
 */
function monitorChangeStreams(changeStreams, intervalMs = 60000) {
  let monitorInterval = null;
  
  const startMonitoring = () => {
    if (monitorInterval) {
      clearInterval(monitorInterval);
    }
    
    monitorInterval = setInterval(async () => {
      const isSupported = await supportsChangeStreams();
      if (!isSupported) {
        console.warn('AVISO: Ambiente atual não suporta Change Streams!');
        return;
      }
      
      const channels = Object.keys(changeStreams);
      console.log(`Monitorando ${channels.length} Change Streams ativos...`);
      
      for (const channel of channels) {
        const stream = changeStreams[channel];
        if (!stream) continue;
        
        // Verificar se o stream está fechado
        if (stream.isClosed()) {
          console.error(`Change Stream para ${channel} está fechado! Tentando recriar...`);
          // Aqui você pode adicionar lógica para recriar o stream
        }
      }
    }, intervalMs);
    
    return monitorInterval;
  };
  
  const stopMonitoring = () => {
    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = null;
    }
  };
  
  return {
    start: startMonitoring,
    stop: stopMonitoring
  };
}

/**
 * Testa a compatibilidade de Change Streams no ambiente atual
 * @returns {Promise<Object>} Resultado do teste
 */
async function testChangeStreamCompatibility() {
  try {
    // Verificar se o MongoDB está conectado
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return {
        success: false,
        message: 'MongoDB não está conectado',
        details: 'Conecte-se ao MongoDB antes de testar Change Streams'
      };
    }
    
    // Verificar se o MongoDB é um Replica Set
    const isSupported = await supportsChangeStreams();
    if (!isSupported) {
      return {
        success: false,
        message: 'MongoDB não está configurado como Replica Set',
        details: 'Change Streams requerem MongoDB configurado como Replica Set'
      };
    }
    
    // Tentar criar um change stream de teste
    try {
      const collection = mongoose.connection.db.collection('_changestream_test');
      const stream = collection.watch();
      
      // Fechar o stream de teste imediatamente
      await stream.close();
      
      return {
        success: true,
        message: 'Change Streams funcionando corretamente',
        details: 'Seu ambiente está configurado para suportar Change Streams'
      };
    } catch (streamError) {
      return {
        success: false,
        message: 'Erro ao criar Change Stream',
        details: streamError.message,
        error: streamError
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao testar compatibilidade',
      details: error.message,
      error
    };
  }
}

/**
 * Cria um endpoint para validar e diagnosticar Change Streams
 * @param {Object} app - Aplicação Express
 * @param {Object} changeStreams - Referência aos Change Streams ativos
 */
function setupChangeStreamDiagnostics(app, changeStreams) {
  if (!app || !app.get) return;
  
  app.get('/api/diagnostics/changestreams', async (req, res) => {
    try {
      const compatibility = await testChangeStreamCompatibility();
      const activeStreams = Object.keys(changeStreams).map(channel => ({
        channel,
        status: changeStreams[channel] ? 'active' : 'inactive',
        isClosed: changeStreams[channel] ? changeStreams[channel].isClosed() : true
      }));
      
      res.json({
        timestamp: new Date().toISOString(),
        compatibility,
        activeStreams,
        environment: {
          mongodbVersion: mongoose.connection.db.serverConfig.serverInfo ? 
                          mongoose.connection.db.serverConfig.serverInfo.version : 'unknown',
          isReplicaSet: !!mongoose.connection.db.serverConfig.s?.replSet,
          nodeEnv: process.env.NODE_ENV
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao executar diagnóstico',
        error: error.message
      });
    }
  });
}

module.exports = {
  monitorChangeStreams,
  testChangeStreamCompatibility,
  setupChangeStreamDiagnostics
};
