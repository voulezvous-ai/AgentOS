/**
 * Configuração do WebSocket Server
 * Define parâmetros e configurações padrão para o servidor
 */

// Obter configurações do ambiente
const WS_PORT = process.env.WS_PORT || 3001;
const WS_PATH = process.env.WS_PATH || '/ws';
const HEARTBEAT_INTERVAL = process.env.WS_HEARTBEAT_INTERVAL 
  ? parseInt(process.env.WS_HEARTBEAT_INTERVAL) 
  : 30000; // 30 segundos
const CONNECTION_TIMEOUT = process.env.WS_CONNECTION_TIMEOUT 
  ? parseInt(process.env.WS_CONNECTION_TIMEOUT) 
  : 60000; // 60 segundos
const MAX_PAYLOAD_SIZE = process.env.WS_MAX_PAYLOAD_SIZE 
  ? parseInt(process.env.WS_MAX_PAYLOAD_SIZE) 
  : 1024 * 1024; // 1MB

// Configurações para o servidor WebSocket
const wsServerConfig = {
  port: WS_PORT,
  path: WS_PATH,
  // Configurações de performance e segurança
  perMessageDeflate: {
    zlibDeflateOptions: {
      // Nível de compressão:
      // O intervalo é de 0 (nenhuma compressão) a 9 (compressão máxima, mais lento)
      // Este valor é um bom equilíbrio entre velocidade e compressão
      level: 4,
      memLevel: 8
    },
    zlibInflateOptions: {
      windowBits: 15,
      memLevel: 8
    },
    // Limite para não comprimir pequenas mensagens
    // Comprimir mensagens pequenas é ineficiente
    threshold: 1024 // 1kb
  },
  // Máximo de tempo em milissegundos de espera entre pings/pongs
  pingTimeout: HEARTBEAT_INTERVAL,
  // Intervalo dos pings de verificação de atividade
  pingInterval: HEARTBEAT_INTERVAL,
  // Tamanho máximo de payload por mensagem
  maxPayload: MAX_PAYLOAD_SIZE,
  // Tempo limite de inatividade da conexão
  clientTracking: true
};

// Configurações para clientes
const wsClientConfig = {
  connectionTimeout: CONNECTION_TIMEOUT,
  reconnectInterval: 2000, // 2 segundos
  maxReconnectAttempts: 10,
  heartbeatEnabled: true,
  heartbeatInterval: HEARTBEAT_INTERVAL,
  // Lista de canais disponíveis
  channels: ['vox', 'couriers', 'support', 'default']
};

// Exportar configurações
module.exports = {
  wsServerConfig,
  wsClientConfig,
  WS_PORT,
  WS_PATH,
  HEARTBEAT_INTERVAL,
  CONNECTION_TIMEOUT,
  MAX_PAYLOAD_SIZE
};
