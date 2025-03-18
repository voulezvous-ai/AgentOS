/**
 * Suporte a cluster mode para o serviço WebSocket
 * Permite que o serviço aproveite múltiplos núcleos do CPU
 */

const cluster = require('cluster');
const os = require('os');
const { logger } = require('./utils/logger');

// Número de trabalhadores (CPUs disponíveis ou valor da variável de ambiente)
const numCPUs = process.env.WORKER_THREADS 
  ? parseInt(process.env.WORKER_THREADS) 
  : os.cpus().length;

// Verificar se deve usar o modo cluster
const useCluster = process.env.CLUSTER_MODE !== 'false';

/**
 * Inicia o serviço WebSocket em modo cluster
 */
function startCluster() {
  // Verificar se é o processo principal
  if (cluster.isPrimary || cluster.isMaster) {
    logger.info(`Processo principal ${process.pid} está rodando`);
    logger.info(`Iniciando ${numCPUs} workers...`);

    // Criar worker para cada CPU
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    // Lidar com saída de workers
    cluster.on('exit', (worker, code, signal) => {
      logger.info(`Worker ${worker.process.pid} morreu com código: ${code} e sinal: ${signal}`);
      logger.info('Iniciando um novo worker...');
      cluster.fork();
    });
    
    // Lidar com eventos de cluster
    cluster.on('online', (worker) => {
      logger.info(`Worker ${worker.process.pid} está online`);
    });
    
    // Monitorar memória do processo master
    let lastMemoryUsage = 0;
    setInterval(() => {
      const memoryUsage = process.memoryUsage().rss / 1024 / 1024;
      const diff = Math.abs(memoryUsage - lastMemoryUsage);
      
      // Só logar a cada variação de 5MB para não encher os logs
      if (diff > 5) {
        logger.info(`Processo principal usando ${memoryUsage.toFixed(2)} MB de RAM`);
        lastMemoryUsage = memoryUsage;
      }
    }, 60000); // Verificar a cada minuto
  } else {
    // Código para workers
    require('./server');
    logger.info(`Worker ${process.pid} iniciado`);
    
    // Monitorar memória dos workers
    let lastMemoryUsage = 0;
    setInterval(() => {
      const memoryUsage = process.memoryUsage().rss / 1024 / 1024;
      const diff = Math.abs(memoryUsage - lastMemoryUsage);
      
      // Só logar a cada variação de 10MB para não encher os logs
      if (diff > 10) {
        logger.info(`Worker ${process.pid} usando ${memoryUsage.toFixed(2)} MB de RAM`);
        lastMemoryUsage = memoryUsage;
      }
    }, 120000); // Verificar a cada 2 minutos
  }
}

/**
 * Inicia o serviço WebSocket em modo single-thread
 */
function startSingleThread() {
  logger.info(`Iniciando em modo single-thread com pid ${process.pid}`);
  require('./server');
}

/**
 * Inicia o serviço no modo apropriado (cluster ou single-thread)
 */
function start() {
  if (useCluster) {
    logger.info('Iniciando em modo cluster');
    startCluster();
  } else {
    logger.info('Iniciando em modo single-thread');
    startSingleThread();
  }
}

// Iniciar serviço
start();
