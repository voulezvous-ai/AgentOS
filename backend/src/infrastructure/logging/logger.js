/**
 * Sistema de logging centralizado para o AgentOS
 * Utiliza Winston para logging estruturado
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório de logs existe
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formatar logs para melhor legibilidade
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, service, ...metadata }) => {
    let metaStr = '';
    if (Object.keys(metadata).length > 0) {
      metaStr = JSON.stringify(metadata, null, 2);
    }
    return `[${timestamp}] [${level.toUpperCase()}] [${service || 'AGENTOS'}]: ${message} ${metaStr}`;
  })
);

// Configurar formato JSON para produção
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Definir transports baseado no ambiente
const transports = [];

// Console sempre ativo
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? jsonFormat : customFormat
  })
);

// Em produção, adicionar arquivo de log
if (process.env.NODE_ENV === 'production') {
  // Log combinado
  transports.push(
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      format: jsonFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  );
  
  // Log de erros
  transports.push(
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  );
}

// Criar o logger base
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'agentos' },
  transports,
  // Não encerrar em exceções não tratadas
  exitOnError: false
});

// Interceptar exceções não tratadas
logger.exceptions.handle(
  new winston.transports.File({ 
    filename: path.join(logDir, 'exceptions.log'),
    format: jsonFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5
  })
);

// Interceptar rejeições de promessas não tratadas
logger.rejections.handle(
  new winston.transports.File({ 
    filename: path.join(logDir, 'rejections.log'),
    format: jsonFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5
  })
);

// Criar logger para um serviço específico
const createServiceLogger = (serviceName) => {
  return {
    error: (message, meta = {}) => logger.error(message, { ...meta, service: serviceName }),
    warn: (message, meta = {}) => logger.warn(message, { ...meta, service: serviceName }),
    info: (message, meta = {}) => logger.info(message, { ...meta, service: serviceName }),
    http: (message, meta = {}) => logger.http(message, { ...meta, service: serviceName }),
    verbose: (message, meta = {}) => logger.verbose(message, { ...meta, service: serviceName }),
    debug: (message, meta = {}) => logger.debug(message, { ...meta, service: serviceName }),
    silly: (message, meta = {}) => logger.silly(message, { ...meta, service: serviceName })
  };
};

module.exports = {
  logger,
  createServiceLogger
};
