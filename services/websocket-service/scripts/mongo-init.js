/**
 * Script de inicialização do MongoDB
 * Executado na primeira inicialização do contêiner
 */

// Criar banco de dados AgentOS
db = db.getSiblingDB('agentos');

// Criar usuário para o banco AgentOS
db.createUser({
  user: 'agentos_user',
  pwd: 'agentos_password',
  roles: [
    { role: 'readWrite', db: 'agentos' },
    { role: 'dbAdmin', db: 'agentos' }
  ]
});

// Criar coleções iniciais
db.createCollection('messages');
db.createCollection('connections');
db.createCollection('stats');

// Criar índices para melhorar performance
db.messages.createIndex({ "channel": 1 });
db.messages.createIndex({ "sender": 1 });
db.messages.createIndex({ "recipient": 1 });
db.messages.createIndex({ "conversationId": 1 });
db.messages.createIndex({ "createdAt": 1 });
db.messages.createIndex({ "readStatus.isRead": 1 });

// Configurar TTL para estatísticas antigas (30 dias)
db.stats.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 2592000 });

print('MongoDB inicializado com sucesso para o AgentOS WebSocket Service!');
