/**
 * Configuração do MongoDB para o AgentOS
 * Preparado para deploy no Railway
 * Suporte a MongoDB Replica Sets e Change Streams
 */

const mongoose = require('mongoose');

// Configurar a URL do MongoDB conforme o ambiente (Railway ou local)
let MONGODB_URI;
let options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: parseInt(process.env.MONGO_CONNECTION_POOL_SIZE) || 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT) || 45000,
  maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME_MS) || 30000,
  retryWrites: process.env.MONGO_RETRY_WRITES === 'true' || true
};

// Verificar se estamos usando Railway e Replica Set
if (process.env.RAILWAY_ENVIRONMENT === 'production' && process.env.MONGO_HOSTS) {
  // Configurar conexão para Replica Set no Railway
  const hosts = process.env.MONGO_HOSTS;
  const replicaSetName = process.env.MONGO_REPLICA_SET_NAME || 'rs0';
  const username = encodeURIComponent(process.env.MONGO_USERNAME);
  const password = encodeURIComponent(process.env.MONGO_PASSWORD);
  const authSource = process.env.MONGO_AUTH_SOURCE || 'admin';
  
  MONGODB_URI = `mongodb://${username}:${password}@${hosts}/${process.env.MONGODB_DATABASE || 'agentos'}?authSource=${authSource}&replicaSet=${replicaSetName}`;
  
  // Opções adicionais para o Replica Set
  options = {
    ...options,
    replicaSet: replicaSetName,
    readPreference: 'secondaryPreferred',
    w: 'majority', // Confirmação de escrita na maioria dos nós
    retryReads: true,
    retryWrites: true
  };
  
  console.log('Usando configuração de MongoDB Replica Set para Railway');
} else {
  // Usar conexão padrão (local ou single instance)
  MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agentos';
  console.log('Usando conexão padrão do MongoDB');
}

/**
 * Conecta ao MongoDB e verifica suporte a Change Streams (requer Replica Set)
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, options);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    
    // Verificar se estamos conectados a um Replica Set (necessário para Change Streams)
    const adminDb = conn.connection.db.admin();
    const serverInfo = await adminDb.serverStatus();
    
    // Verificar se o modo de replicação está ativo
    if (serverInfo.repl) {
      console.log(`MongoDB Replica Set detectado: ${serverInfo.repl.setName}`);
      console.log('Suporte a Change Streams está disponível');
    } else {
      console.warn('AVISO: MongoDB não está configurado como Replica Set!');
      console.warn('Change Streams NÃO estarão disponíveis. Algumas funcionalidades em tempo real podem não funcionar.');
      console.warn('Para desenvolvimento local com Change Streams, configure um Replica Set MongoDB.');
    }
    
    return conn;
  } catch (error) {
    console.error(`Erro de conexão com MongoDB: ${error.message}`);
    
    // Tentar novamente após 5 segundos se estivermos no Railway (pode ser apenas atraso na inicialização)
    if (process.env.RAILWAY_ENVIRONMENT === 'production') {
      console.log('Tentando reconectar em 5 segundos...');
      setTimeout(() => connectDB(), 5000);
      return;
    }
    
    process.exit(1);
  }
};

/**
 * Fecha a conexão com o MongoDB
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('Conexão com MongoDB fechada');
  } catch (error) {
    console.error(`Erro ao fechar conexão com MongoDB: ${error.message}`);
  }
};

// Event listeners para melhor diagnóstico
mongoose.connection.on('connected', () => {
  console.log('Mongoose conectado ao MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(`Erro na conexão Mongoose: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose desconectado do MongoDB');
});

// Fechar conexão quando o processo Node terminar
process.on('SIGINT', async () => {
  await closeDB();
  console.log('Aplicação encerrada');
  process.exit(0);
});

/**
 * Verifica se a instancia MongoDB suporta Change Streams
 * @returns {Promise<boolean>} true se Change Streams é suportado
 */
const supportsChangeStreams = async () => {
  if (!mongoose.connection || !mongoose.connection.db) {
    return false;
  }
  
  try {
    const adminDb = mongoose.connection.db.admin();
    const serverInfo = await adminDb.serverStatus();
    return !!serverInfo.repl; // Existe apenas se for um Replica Set
  } catch (error) {
    console.error('Erro ao verificar suporte a Change Streams:', error);
    return false;
  }
};

module.exports = {
  connectDB,
  closeDB,
  mongoose,
  supportsChangeStreams
};
