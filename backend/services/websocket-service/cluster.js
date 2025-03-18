/**
 * Suporte a cluster mode para o serviço WebSocket
 * Permite que o serviço aproveite múltiplos núcleos do CPU
 */

const cluster = require('cluster');
const os = require('os');
const path = require('path');

// Número de trabalhadores (CPUs disponíveis ou valor da variável de ambiente)
const numCPUs = process.env.WORKER_THREADS 
  ? parseInt(process.env.WORKER_THREADS) 
  : os.cpus().length;

// Verificar se deve usar o modo cluster
const useCluster = process.env.CLUSTER_MODE === 'true';

/**
 * Inicia o serviço WebSocket em modo cluster
 */
function startCluster() {
  // Verificar se é o processo principal
  if (cluster.isMaster) {
    console.log(`Processo principal ${process.pid} está rodando`);
    console.log(`Iniciando ${numCPUs} workers...`);

    // Criar worker para cada CPU
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    // Lidar com saída de workers
    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} morreu com código: ${code} e sinal: ${signal}`);
      console.log('Iniciando um novo worker...');
      cluster.fork();
    });
  } else {
    // Código para workers
    const server = require('./server');
    console.log(`Worker ${process.pid} iniciado`);
  }
}

/**
 * Inicia o serviço WebSocket em modo single-thread
 */
function startSingleThread() {
  console.log(`Iniciando em modo single-thread com pid ${process.pid}`);
  require('./server');
}

// Determina o modo de inicialização
if (useCluster) {
  console.log('Iniciando em modo cluster');
  startCluster();
} else {
  console.log('Iniciando em modo single-thread');
  startSingleThread();
}

module.exports = {
  startCluster,
  startSingleThread
};
