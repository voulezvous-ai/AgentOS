/**
 * Sistema de logging centralizado para o WebSocket Service
 * Fornece um logger consistente para toda a aplicação
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório de logs existe
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Definir níveis de log e cores
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Definir cores para cada nível
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Adicionar cores ao Winston
winston.addColors(colors);

// Definir formato para logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Definir o formato para logs de consola
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Determinar o nível de log baseado no ambiente
const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Criar o logger
const logger = winston.createLogger({
  level,
  levels,
  format,
  transports: [
    // Log em arquivo para todos os níveis
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    }),
    
    // Log em consola apenas em desenvolvimento
    ...(process.env.NODE_ENV !== 'production' 
      ? [new winston.transports.Console({ format: consoleFormat })] 
      : [])
  ],
});

// Criar um stream para logs HTTP
const httpLogStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = {
  logger,
  httpLogStream,
};
