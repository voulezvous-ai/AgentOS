/**
 * Fábrica de adaptadores para gerenciar diferentes tipos de clientes de mensageria
 * Suporta múltiplas instâncias de WhatsApp e Instagram Messenger
 */

const BaileysAdapter = require('./baileysAdapter');
const WebJsAdapter = require('./webjsAdapter');
const InstagramAdapter = require('./instagramAdapter');
const { ServiceError } = require('../utils/errors');
const { logger } = require('../utils/logger');

/**
 * Fábrica para criar adaptadores WhatsApp
 */
class AdapterFactory {
  /**
   * Cria um adaptador com base no tipo e opções
   * @param {string} type - Tipo de adaptador ('webjs', 'baileys', 'instagram')
   * @param {Object} options - Opções de configuração do adaptador
   * @returns {Object} Instância do adaptador
   */
  static createAdapter(type, options = {}) {
    logger.info(`Criando adaptador do tipo ${type}`);
    
    switch (type.toLowerCase()) {
      case 'webjs':
        return new WebJsAdapter(options);
        
      case 'baileys':
        return new BaileysAdapter(options);
        
      case 'instagram':
        return new InstagramAdapter(options);
        
      default:
        throw new ServiceError(`Tipo de adaptador não suportado: ${type}`);
    }
  }
  
  /**
   * Obtém a lista de tipos de adaptadores suportados
   * @returns {Array<string>} Lista de tipos suportados
   */
  static getSupportedTypes() {
    return ['webjs', 'baileys', 'instagram'];
  }
  
  /**
   * Verifica se um tipo é suportado
   * @param {string} type - Tipo de adaptador
   * @returns {boolean} Se o tipo é suportado
   */
  static isTypeSupported(type) {
    return this.getSupportedTypes().includes(type.toLowerCase());
  }
  
  /**
   * Obtém recursos e capacidades de um tipo de adaptador
   * @param {string} type - Tipo de adaptador
   * @returns {Object} Recursos e capacidades
   */
  static getAdapterCapabilities(type) {
    const capabilities = {
      webjs: {
        name: 'WhatsApp Web.js',
        description: 'Adaptador baseado na biblioteca whatsapp-web.js, ideal para mensagens diretas.',
        features: [
          'Envio de mensagens de texto',
          'Envio de mídia (imagens, vídeos, áudios, documentos)',
          'Recebimento de mensagens',
          'QR Code para autenticação',
          'Gerenciamento de sessão',
          'Acesso a chats',
          'Marcação de mensagens como lidas',
        ],
        limitations: [
          'Requer headless browser',
          'Consumo de memória maior',
          'Desempenho menor para múltiplos clientes',
        ],
        recommendedUse: 'Recomendado para casos de uso de mensagens diretas e interações mais simples.'
      },
      
      baileys: {
        name: 'Baileys',
        description: 'Adaptador baseado na biblioteca @whiskeysockets/baileys, ideal para grupos e funcionalidades avançadas.',
        features: [
          'Envio de mensagens de texto',
          'Envio de mídia (imagens, vídeos, áudios, documentos)',
          'Recebimento de mensagens',
          'QR Code para autenticação',
          'Gerenciamento de sessão',
          'Acesso a chats',
          'Acesso a grupos',
          'Criação e gerenciamento de grupos',
          'Menor consumo de recursos',
        ],
        limitations: [
          'API menos estável',
          'Documentação mais limitada',
        ],
        recommendedUse: 'Recomendado para casos de uso avançados, especialmente envolvendo grupos.'
      },
      
      instagram: {
        name: 'Instagram Messenger',
        description: 'Adaptador para o Instagram Messenger usando a API do Instagram Graph.',
        features: [
          'Envio de mensagens de texto',
          'Envio de mídia (imagens, vídeos)',
          'Recebimento de mensagens',
          'Integração com Facebook Business',
          'Suporte a webhooks',
        ],
        limitations: [
          'Requer conta comercial do Instagram',
          'Requer app do Facebook aprovado',
          'Requer página do Facebook vinculada',
          'Sem suporte para áudio e documentos',
          'Requer webhook para produção',
        ],
        recommendedUse: 'Recomendado para negócios que desejam interagir com clientes via Instagram.'
      }
    };
    
    if (!this.isTypeSupported(type)) {
      throw new ServiceError(`Tipo de adaptador não suportado: ${type}`);
    }
    
    return capabilities[type.toLowerCase()];
  }
}

module.exports = AdapterFactory;
