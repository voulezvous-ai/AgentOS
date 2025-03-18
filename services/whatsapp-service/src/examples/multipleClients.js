/**
 * Exemplo de como usar múltiplas instâncias de clientes WhatsApp e Instagram
 * Este script demonstra a implementação de dois clientes WhatsApp e um cliente Instagram
 */

const BaileysAdapter = require('../adapters/baileysAdapter');
const InstagramAdapter = require('../adapters/instagramAdapter');
const config = require('../config/config');
const { logger } = require('../utils/logger');

// Função para criar e inicializar clientes
async function initializeMultipleClients() {
  try {
    logger.info('Iniciando configuração de múltiplos clientes...');
    
    // Array para armazenar todos os clientes
    const clients = [];
    
    // Configuração do primeiro cliente WhatsApp
    const whatsappClient1 = new BaileysAdapter({
      clientId: 'whatsapp-primary',
      printQRInTerminal: true // Facilita o teste mostrando QR no terminal
    });
    
    // Configuração do segundo cliente WhatsApp
    const whatsappClient2 = new BaileysAdapter({
      clientId: 'whatsapp-secondary',
      printQRInTerminal: true
    });
    
    // Configuração do cliente Instagram
    const instagramClient = new InstagramAdapter({
      clientId: 'instagram-primary'
    });
    
    // Listeners para o primeiro cliente WhatsApp
    whatsappClient1.on('qr', (qr) => {
      logger.info('QR Code recebido para cliente WhatsApp Primary');
      console.log('Escaneie o QR Code para WhatsApp Primary:', qr);
    });
    
    whatsappClient1.on('ready', () => {
      logger.info('Cliente WhatsApp Primary está pronto!');
    });
    
    whatsappClient1.on('message', (message) => {
      logger.info(`Mensagem recebida no WhatsApp Primary: ${message.body}`);
      
      // Exemplo de resposta automática
      if (message.body.toLowerCase().includes('olá')) {
        whatsappClient1.sendText(message.sender, 'Olá! Esta é uma resposta automática do WhatsApp Primary.').catch(console.error);
      }
    });
    
    // Listeners para o segundo cliente WhatsApp
    whatsappClient2.on('qr', (qr) => {
      logger.info('QR Code recebido para cliente WhatsApp Secondary');
      console.log('Escaneie o QR Code para WhatsApp Secondary:', qr);
    });
    
    whatsappClient2.on('ready', () => {
      logger.info('Cliente WhatsApp Secondary está pronto!');
    });
    
    whatsappClient2.on('message', (message) => {
      logger.info(`Mensagem recebida no WhatsApp Secondary: ${message.body}`);
      
      // Exemplo de resposta automática
      if (message.body.toLowerCase().includes('olá')) {
        whatsappClient2.sendText(message.sender, 'Olá! Esta é uma resposta automática do WhatsApp Secondary.').catch(console.error);
      }
    });
    
    // Listeners para o cliente Instagram
    instagramClient.on('ready', () => {
      logger.info('Cliente Instagram está pronto!');
    });
    
    instagramClient.on('message', (message) => {
      logger.info(`Mensagem recebida no Instagram: ${message.body}`);
      
      // Exemplo de resposta automática
      if (message.body.toLowerCase().includes('olá')) {
        instagramClient.sendText(message.sender, 'Olá! Esta é uma resposta automática do Instagram.').catch(console.error);
      }
    });
    
    // Inicialização de todos os clientes
    logger.info('Inicializando cliente WhatsApp Primary...');
    await whatsappClient1.initialize();
    clients.push(whatsappClient1);
    
    logger.info('Inicializando cliente WhatsApp Secondary...');
    await whatsappClient2.initialize();
    clients.push(whatsappClient2);
    
    logger.info('Inicializando cliente Instagram...');
    await instagramClient.initialize();
    clients.push(instagramClient);
    
    logger.info('Todos os clientes inicializados com sucesso!');
    
    // Demonstração de envio de mensagem entre os clientes WhatsApp (se for o mesmo número)
    // Este é apenas um exemplo e deve ser ajustado para números reais
    setTimeout(async () => {
      try {
        if (whatsappClient1.isReady() && whatsappClient2.isReady()) {
          // Substitua pelo número do destinatário
          const testNumber = '5511999999999';
          
          await whatsappClient1.sendText(testNumber, 'Mensagem de teste do Cliente Primary');
          logger.info('Mensagem de teste enviada do cliente Primary');
          
          await whatsappClient2.sendText(testNumber, 'Mensagem de teste do Cliente Secondary');
          logger.info('Mensagem de teste enviada do cliente Secondary');
        }
      } catch (error) {
        logger.error('Erro ao enviar mensagem de teste:', error);
      }
    }, 10000);
    
    // Retorna os clientes para uso posterior
    return clients;
    
  } catch (error) {
    logger.error('Erro ao inicializar múltiplos clientes:', error);
    throw error;
  }
}

// Execução do exemplo
if (require.main === module) {
  initializeMultipleClients()
    .then((clients) => {
      logger.info(`${clients.length} clientes inicializados com sucesso`);
      
      // Mantém o processo rodando
      process.stdin.resume();
      
      // Tratamento para encerramento limpo
      const cleanup = async () => {
        logger.info('Encerrando clientes...');
        
        for (const client of clients) {
          try {
            await client.logout();
          } catch (err) {
            logger.error(`Erro ao desconectar cliente: ${err.message}`);
          }
        }
        
        logger.info('Todos os clientes foram desconectados');
        process.exit(0);
      };
      
      // Captura sinais de encerramento
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    })
    .catch((error) => {
      logger.error('Falha na inicialização dos clientes:', error);
      process.exit(1);
    });
}

module.exports = { initializeMultipleClients };
