/**
 * Configuração centralizada de logging para o serviço WhatsApp
 * Usa Winston para fornecer logs estruturados e níveis de log configuráveis
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// Garante que o diretório de logs exista
const logDir = config.logging.dir;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define o formato do timestamp
const timestampFormat = winston.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss.SSS'
});

// Define o formato base para todos os transportes
const baseFormat = winston.format.combine(
  timestampFormat,
  winston.format.errors({ stack: true }),
  winston.format.splat()
);

// Define o formato para console
const consoleFormat = winston.format.combine(
  baseFormat,
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...rest }) => {
    const restString = Object.keys(rest).length ? 
      `\n${JSON.stringify(rest, null, 2)}` : '';
    
    return `${timestamp} [${level}]: ${message}${restString}`;
  })
);

// Define o formato para arquivos
const fileFormat = winston.format.combine(
  baseFormat,
  winston.format.json()
);

// Cria o logger
const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: { service: 'whatsapp-service' },
  transports: [
    // Log para console
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // Log para arquivo (todos os níveis)
    new winston.transports.File({
      filename: path.join(logDir, 'whatsapp-combined.log'),
      format: fileFormat
    }),
    
    // Log de erros para arquivo separado
    new winston.transports.File({
      filename: path.join(logDir, 'whatsapp-error.log'),
      level: 'error',
      format: fileFormat
    })
  ],
  exitOnError: false
});

// Desativa logs em testes, exceto se especificado
if (process.env.NODE_ENV === 'test' && !process.env.LOG_IN_TESTS) {
  logger.transports.forEach((transport) => {
    transport.silent = true;
  });
}

// Função de log para uso como middleware Express
const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  });
  
  next();
};

module.exports = {
  logger,
  httpLogger
};
