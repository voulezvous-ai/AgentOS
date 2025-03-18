/**
 * Graceful Shutdown Script
 * 
 * Este script gerencia o desligamento gracioso do serviço WebSocket,
 * permitindo que conexões existentes sejam fechadas adequadamente e
 * que todos os Change Streams sejam fechados.
 */

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

// Importando o controlador de mensagens para fechar os Change Streams
const messageController = require('../controllers/messageController');

// Caminho para o arquivo PID do processo principal
const PID_FILE = path.join(__dirname, '..', '.pid');
const readFile = promisify(fs.readFile);

/**
 * Função principal para executar o desligamento gracioso
 */
async function gracefulShutdown() {
  try {
    console.log('Iniciando desligamento gracioso...');
    
    // Encerrando todos os Change Streams ativos
    console.log('Fechando Change Streams...');
    await messageController.closeAllChangeStreams();
    console.log('Todos os Change Streams foram fechados com sucesso.');
    
    // Enviando mensagem de status para todos os clientes conectados
    console.log('Notificando clientes conectados sobre desligamento...');
    try {
      const WebSocket = require('ws');
      const wss = global.wss || new WebSocket.Server({ noServer: true });
      
      if (wss && wss.clients) {
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'SERVER_SHUTDOWN',
              message: 'O servidor está sendo desligado para manutenção. Por favor, reconecte em alguns instantes.',
              timestamp: new Date().toISOString()
            }));
          }
        });
      }
    } catch (err) {
      console.error('Erro ao notificar clientes:', err);
    }
    
    // Aguardando para que as mensagens sejam enviadas
    console.log('Aguardando 2 segundos para envio de mensagens...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Obtendo PID do processo principal
    try {
      const pidContent = await readFile(PID_FILE, 'utf8');
      const pid = parseInt(pidContent.trim(), 10);
      
      if (pid && !isNaN(pid)) {
        console.log(`Enviando sinal SIGTERM para processo principal (PID: ${pid})...`);
        process.kill(pid, 'SIGTERM');
      } else {
        console.log('PID inválido no arquivo .pid');
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('Arquivo .pid não encontrado.');
      } else {
        console.error('Erro ao ler arquivo PID:', err);
      }
      
      // Se não conseguimos enviar SIGTERM para o processo principal, encerramos com código de sucesso
      console.log('Desligamento gracioso concluído.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Erro durante desligamento gracioso:', error);
    process.exit(1);
  }
}

// Executar o desligamento gracioso
gracefulShutdown();
