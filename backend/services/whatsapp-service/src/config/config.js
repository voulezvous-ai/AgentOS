/**
 * Configuração central do serviço de mensageria
 * Suporta WhatsApp (múltiplas instâncias) e Instagram
 * Carrega variáveis de ambiente e define configurações padrão
 */
require('dotenv').config();

const config = {
  // Informações do serviço
  app: {
    name: 'messaging-service',
    port: process.env.PORT || 3040,
    env: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
    apiPrefix: process.env.API_PREFIX || '/api',
    shutdownTimeout: parseInt(process.env.SHUTDOWN_TIMEOUT || '10000', 10),
    clusterMode: process.env.CLUSTER_MODE === 'true' || false,
    workerThreads: process.env.WORKER_THREADS ? parseInt(process.env.WORKER_THREADS) : undefined,
  },

  // Configurações do MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/agentos',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    reconnectInterval: parseInt(process.env.MONGODB_RECONNECT_INTERVAL || '5000', 10),
    reconnectTries: parseInt(process.env.MONGODB_RECONNECT_TRIES || '10', 10),
  },

  // Configurações de segurança
  security: {
    jwtSecret: process.env.JWT_SECRET || 'seu-segredo-jwt-padrao',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    apiKeyHeader: process.env.API_KEY_HEADER || 'x-api-key',
    apiKeys: process.env.API_KEYS ? process.env.API_KEYS.split(',') : [],
    rateLimiting: {
      enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
      windowMs: parseInt(process.env.RATE_LIMITING_WINDOW_MS || '60000', 10), // 1 minuto
      max: parseInt(process.env.RATE_LIMITING_MAX || '100', 10), // 100 requisições por minuto
    },
  },

  // Configurações do WhatsApp
  whatsapp: {
    sessionsDir: process.env.WHATSAPP_SESSIONS_DIR || './.whatsapp-sessions',
    mediaDir: process.env.WHATSAPP_MEDIA_DIR || './media/whatsapp',
    headless: process.env.WHATSAPP_HEADLESS !== 'false', // true por padrão
    qrCodeTtl: parseInt(process.env.WHATSAPP_QR_TTL || '60000', 10),
    qrRefreshInterval: parseInt(process.env.WHATSAPP_QR_REFRESH_INTERVAL || '30000'),
    connectionTimeout: parseInt(process.env.WHATSAPP_CONNECTION_TIMEOUT || '60000'),
    messageHistoryLimit: parseInt(process.env.MESSAGE_HISTORY_LIMIT || '100', 10),
    clientAutoReconnect: process.env.CLIENT_AUTO_RECONNECT !== 'false',
    mediaCacheEnabled: process.env.MEDIA_CACHE_ENABLED !== 'false',
    mediaCacheTtl: parseInt(process.env.MEDIA_CACHE_TTL || '86400000', 10), // 24 horas
    maxConcurrentClients: parseInt(process.env.MAX_CONCURRENT_CLIENTS || '10', 10),
    multiInstanceSupport: process.env.WHATSAPP_MULTI_INSTANCE !== 'false', // Suporte para múltiplos clientes
    // Novas configurações para Baileys 6.7.16+
    autoReadMessages: process.env.AUTO_READ_MESSAGES === 'true' || false, // Marca mensagens como lidas automaticamente
    syncFullHistory: process.env.SYNC_FULL_HISTORY === 'true' || false, // Sincroniza histórico completo (cuidado com consumo de recursos)
    reconnectInterval: parseInt(process.env.WHATSAPP_RECONNECT_INTERVAL || '2000', 10), // Intervalo para reconexão
    maxReconnectAttempts: parseInt(process.env.WHATSAPP_MAX_RECONNECT_ATTEMPTS || '5', 10), // Tentativas máximas de reconexão
    useLatestWaWebVersion: process.env.USE_LATEST_WAWEB_VERSION !== 'false', // Usa a versão mais recente da API WhatsApp Web
    transactionTimeout: parseInt(process.env.WHATSAPP_TRANSACTION_TIMEOUT || '30000', 10), // Timeout para transações de mensagens
    messageRetryCounterCacheTtl: parseInt(process.env.MESSAGE_RETRY_COUNTER_CACHE_TTL || '3600', 10), // TTL do cache para contadores de retry
    webhook: {
      enabled: process.env.WEBHOOK_ENABLED === 'true' || false,
      url: process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/whatsapp',
      secret: process.env.WEBHOOK_SECRET || 'webhook-secret',
    }
  },

  // Configurações do Instagram
  instagram: {
    sessionsDir: process.env.INSTAGRAM_SESSIONS_DIR || './.instagram-sessions',
    mediaDir: process.env.INSTAGRAM_MEDIA_DIR || './media/instagram',
    apiVersion: process.env.INSTAGRAM_API_VERSION || 'v16.0',
    pollingInterval: parseInt(process.env.INSTAGRAM_POLLING_INTERVAL || '10000', 10), // 10 segundos
    mediaCacheEnabled: process.env.INSTAGRAM_MEDIA_CACHE_ENABLED !== 'false',
    mediaCacheTtl: parseInt(process.env.INSTAGRAM_MEDIA_CACHE_TTL || '86400000', 10), // 24 horas
    maxConcurrentClients: parseInt(process.env.INSTAGRAM_MAX_CONCURRENT_CLIENTS || '5', 10),
    webhook: {
      enabled: process.env.INSTAGRAM_WEBHOOK_ENABLED === 'true' || false,
      verifyToken: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'instagram-verify-token',
      url: process.env.INSTAGRAM_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/instagram',
      port: parseInt(process.env.INSTAGRAM_WEBHOOK_PORT || '3001', 10),
    }
  },

  // Configurações de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    dir: process.env.LOG_DIR || 'logs',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '7', 10),
    sanitizePaths: process.env.LOG_SANITIZE_PATHS !== 'false',
    logRequests: process.env.LOG_REQUESTS !== 'false',
  },

  // Configurações de WebSocket para comunicação em tempo real
  websocket: {
    enabled: process.env.WS_ENABLED !== 'false',
    path: process.env.WS_PATH || '/ws/messaging',
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000'),
    connectionTimeout: parseInt(process.env.WS_CONNECTION_TIMEOUT || '120000'),
    maxPayloadSize: parseInt(process.env.WS_MAX_PAYLOAD_SIZE || '5242880'), // 5MB em bytes
  },
  
  // Configurações de cache
  caching: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_TTL || '300000', 10), // 5 minutos
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600000', 10), // 10 minutos
  },
  
  // Configurações de manutenção
  maintenance: {
    messageRetentionDays: parseInt(process.env.MESSAGE_RETENTION_DAYS || '90', 10),
    autoCleanupInterval: parseInt(process.env.AUTO_CLEANUP_INTERVAL || '86400000', 10), // 24 horas
    autoCleanupEnabled: process.env.AUTO_CLEANUP_ENABLED !== 'false',
  }
};

module.exports = config;
