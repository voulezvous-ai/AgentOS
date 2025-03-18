/**
 * Script para migração de dados entre a estrutura antiga e a nova
 * Migra mensagens, configurações e ajusta dados conforme necessário
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

// MongoDB URI
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agentos';

// Modelo antigo (definir schema novamente para garantir compatibilidade)
const OldMessageSchema = new mongoose.Schema({
  channel: String,
  sender: String,
  senderType: String,
  recipient: String,
  content: String,
  contentType: String,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

/**
 * Conecta ao MongoDB
 * @returns {Promise<boolean>} Status da conexão
 */
async function connectToDB() {
  try {
    logger.info(`Conectando ao MongoDB: ${mongoURI}`);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info('Conexão estabelecida com sucesso');
    return true;
  } catch (error) {
    logger.error('Erro ao conectar ao MongoDB:', error);
    return false;
  }
}

/**
 * Migra mensagens do modelo antigo para o novo
 * @returns {Promise<number>} Número de documentos migrados
 */
async function migrateMessages() {
  try {
    logger.info('Iniciando migração de mensagens...');
    
    // Carregar novos modelos
    const NewMessage = require('../models/Message');
    
    // Carregar modelo antigo (apenas para migração)
    const OldMessage = mongoose.model('OldMessage', OldMessageSchema, 'messages');
    
    // Contar documentos do modelo antigo
    const count = await OldMessage.countDocuments({});
    logger.info(`Encontradas ${count} mensagens para migrar`);
    
    // Processar em lotes para evitar sobrecarga de memória
    const batchSize = 100;
    let processedCount = 0;
    let migratedCount = 0;
    
    // Loop para processar em lotes
    for (let skip = 0; skip < count; skip += batchSize) {
      const messages = await OldMessage.find({})
        .skip(skip)
        .limit(batchSize)
        .lean();
      
      // Processar cada mensagem do lote
      const migratedMessages = messages.map(msg => ({
        channel: msg.channel || 'default',
        conversationId: msg.metadata?.conversationId || null,
        sender: msg.sender,
        senderName: msg.metadata?.senderName || null,
        senderType: msg.senderType || 'user',
        recipient: msg.recipient,
        content: msg.content,
        contentType: msg.contentType || 'text',
        readStatus: {
          isRead: msg.metadata?.isRead || false,
          readAt: msg.metadata?.readAt || null
        },
        metadata: {
          ...msg.metadata,
          migratedAt: new Date(),
          originalId: msg._id.toString()
        },
        createdAt: msg.createdAt || new Date(),
        updatedAt: msg.updatedAt || new Date()
      }));
      
      // Inserir mensagens migradas
      if (migratedMessages.length > 0) {
        const result = await NewMessage.insertMany(migratedMessages, { ordered: false });
        migratedCount += result.length;
      }
      
      processedCount += messages.length;
      logger.info(`Progresso: ${processedCount}/${count} (${Math.round(processedCount/count*100)}%)`);
    }
    
    logger.info(`Migração concluída. ${migratedCount} mensagens migradas com sucesso.`);
    return migratedCount;
  } catch (error) {
    logger.error('Erro durante migração de mensagens:', error);
    throw error;
  }
}

/**
 * Registra resultado da migração em arquivo de log
 * @param {Object} results Resultados da migração
 */
function logMigrationResults(results) {
  try {
    const logFile = path.join(__dirname, '../../logs/migration.json');
    const dirName = path.dirname(logFile);
    
    // Garantir que o diretório existe
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }
    
    // Adicionar timestamp
    results.timestamp = new Date().toISOString();
    
    // Salvar log
    fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
    logger.info(`Registro de migração salvo em: ${logFile}`);
  } catch (error) {
    logger.error('Erro ao registrar resultados da migração:', error);
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    logger.info('Iniciando migração de dados para a nova estrutura...');
    
    // Verificar parâmetros de linha de comando
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    
    if (dryRun) {
      logger.info('Modo DRY RUN: nenhuma alteração será feita');
    }
    
    // Conectar ao MongoDB
    const connected = await connectToDB();
    
    if (!connected) {
      logger.error('Não foi possível conectar ao MongoDB. Abortando migração.');
      process.exit(1);
    }
    
    // Executar migração apenas se não for dry-run
    let results = { success: false };
    
    if (!dryRun) {
      // Migrar mensagens
      const migratedMessages = await migrateMessages();
      
      results = {
        success: true,
        migratedMessages,
        date: new Date()
      };
      
      // Registrar resultados
      logMigrationResults(results);
    }
    
    // Fechar conexão
    await mongoose.connection.close();
    logger.info('Migração concluída.');
    
    process.exit(0);
  } catch (error) {
    logger.error('Erro durante migração:', error);
    
    // Garantir que a conexão seja fechada
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// Verificar se o script foi executado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  connectToDB,
  migrateMessages
};
