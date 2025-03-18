# Integração Técnica: Vox e WhatsApp (Baileys 6.7.16+)

## Visão Geral

Este documento detalha a implementação técnica da integração entre o assistente virtual Vox e o serviço de WhatsApp utilizando o adaptador Baileys na versão 6.7.16+. Esta integração representa um componente fundamental na estratégia de posicionar o Vox como elemento central do ecossistema AgentOS.

## Arquitetura da Integração

![Arquitetura da Integração Vox-WhatsApp](https://i.imgur.com/placeholder.png)

### Componentes Principais

1. **Adaptador Baileys (WhatsApp)**: Interface com a API do WhatsApp
2. **Mediador de Mensagens**: Traduz mensagens entre os formatos do WhatsApp e Vox
3. **Gerenciador de Contexto**: Mantém o estado da conversa
4. **Processador Vox**: Processa mensagens e gera respostas
5. **Orquestrador de Serviços**: Coordena chamadas a outros serviços quando necessário

## Fluxo de Dados

### Recebimento de Mensagens (WhatsApp → Vox)

```
WhatsApp → Adaptador Baileys → Mediador de Mensagens → Gerenciador de Contexto → Processador Vox
```

1. **Adaptador Baileys** recebe mensagem do WhatsApp
2. **Mediador de Mensagens** converte para formato universal do Vox, adicionando metadados
3. **Gerenciador de Contexto** recupera ou cria contexto da conversa
4. **Processador Vox** analisa a mensagem e gera resposta apropriada

### Envio de Respostas (Vox → WhatsApp)

```
Processador Vox → Orquestrador de Serviços → Mediador de Mensagens → Adaptador Baileys → WhatsApp
```

1. **Processador Vox** gera resposta 
2. **Orquestrador de Serviços** executa ações em outros sistemas se necessário
3. **Mediador de Mensagens** converte para formato compatível com WhatsApp
4. **Adaptador Baileys** envia mensagem via API WhatsApp

## Implementação Técnica

### 1. Módulo de Mediação de Mensagens

O mediador é responsável pela tradução bidirecional entre os formatos:

```javascript
// src/mediators/whatsappVoxMediator.js

class WhatsappVoxMediator {
  /**
   * Converte mensagem do WhatsApp para formato Vox
   * @param {Object} whatsappMessage - Mensagem recebida do WhatsApp 
   * @returns {Object} Mensagem no formato universal Vox
   */
  toVoxFormat(whatsappMessage) {
    return {
      id: `whatsapp:${whatsappMessage.messageId}`,
      channelType: 'whatsapp',
      channelId: whatsappMessage.chatId,
      senderId: whatsappMessage.sender,
      recipientId: whatsappMessage.recipient,
      content: {
        type: this._mapContentType(whatsappMessage),
        text: whatsappMessage.body,
        media: whatsappMessage.mediaUrl,
        metadata: this._extractMetadata(whatsappMessage)
      },
      timestamp: whatsappMessage.timestamp,
      contextId: `chat:${whatsappMessage.chatId}`
    };
  }
  
  /**
   * Converte mensagem do formato Vox para WhatsApp
   * @param {Object} voxMessage - Mensagem no formato Vox
   * @returns {Object} Mensagem formatada para WhatsApp
   */
  toWhatsappFormat(voxMessage) {
    // Implementação similar para conversão inversa
  }
  
  // Métodos auxiliares
  _mapContentType(whatsappMessage) {/* ... */}
  _extractMetadata(whatsappMessage) {/* ... */}
}

module.exports = new WhatsappVoxMediator();
```

### 2. Gerenciador de Contexto

Responsável por manter o estado das conversas:

```javascript
// src/services/contextManager.js

const { createRedisClient } = require('../utils/redis');
const redis = createRedisClient();

class ContextManager {
  /**
   * Recupera contexto de conversa
   * @param {string} contextId - Identificador único do contexto
   * @returns {Promise<Object>} Contexto da conversa
   */
  async getContext(contextId) {
    const rawContext = await redis.get(`context:${contextId}`);
    if (!rawContext) return this._createNewContext(contextId);
    
    const context = JSON.parse(rawContext);
    return {
      ...context,
      lastAccessed: Date.now()
    };
  }
  
  /**
   * Atualiza contexto com nova informação
   * @param {string} contextId - Identificador do contexto
   * @param {Object} updates - Atualizações para aplicar
   */
  async updateContext(contextId, updates) {
    const context = await this.getContext(contextId);
    const updatedContext = {
      ...context,
      ...updates,
      lastUpdated: Date.now()
    };
    
    // Define TTL de 24 horas
    await redis.set(
      `context:${contextId}`,
      JSON.stringify(updatedContext),
      'EX',
      86400
    );
    
    return updatedContext;
  }
  
  /**
   * Cria novo contexto
   * @private
   */
  _createNewContext(contextId) {
    return {
      contextId,
      created: Date.now(),
      lastAccessed: Date.now(),
      history: [],
      entities: {},
      sessionData: {},
      activeTasks: []
    };
  }
}

module.exports = new ContextManager();
```

### 3. Integração com o Adaptador Baileys

Modificação do BaileysAdapter para conectar com o Vox:

```javascript
// src/adapters/baileysAdapter.js

// Imports existentes...
const whatsappVoxMediator = require('../mediators/whatsappVoxMediator');
const voxProcessor = require('../services/voxProcessor');
const contextManager = require('../services/contextManager');

class BaileysAdapter {
  // Código existente...
  
  /**
   * Processa mensagem recebida e envia para o Vox
   * @param {Object} message - Mensagem do WhatsApp
   */
  async _handleIncomingMessage(message) {
    try {
      // Converte para formato Vox
      const voxMessage = whatsappVoxMediator.toVoxFormat(message);
      
      // Recupera contexto da conversa
      const contextId = voxMessage.contextId;
      const context = await contextManager.getContext(contextId);
      
      // Processa com o Vox
      const voxResponse = await voxProcessor.processMessage(voxMessage, context);
      
      // Atualiza o contexto com a interação
      await contextManager.updateContext(contextId, {
        history: [...context.history, {
          role: 'user',
          content: voxMessage.content.text,
          timestamp: voxMessage.timestamp
        }, {
          role: 'assistant',
          content: voxResponse.text,
          timestamp: Date.now()
        }]
      });
      
      // Envia resposta
      if (voxResponse.text) {
        const whatsappResponse = whatsappVoxMediator.toWhatsappFormat(voxResponse);
        await this.sendText(
          message.chatId, 
          whatsappResponse.content,
          whatsappResponse.options
        );
      }
      
      // Executa ações adicionais se houver
      if (voxResponse.actions && voxResponse.actions.length > 0) {
        await this._executeVoxActions(voxResponse.actions, message);
      }
      
    } catch (error) {
      logger.error('Erro ao processar mensagem com Vox:', error);
    }
  }
  
  /**
   * Executa ações solicitadas pelo Vox
   * @private
   */
  async _executeVoxActions(actions, originalMessage) {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'send_media':
            await this.sendMedia(
              originalMessage.chatId,
              action.mediaUrl,
              action.caption,
              action.options
            );
            break;
            
          case 'mark_read':
            await this.markChatAsRead(originalMessage.chatId);
            break;
            
          case 'call_service':
            // Integração com outros serviços
            // Implementar
            break;
        }
      } catch (actionError) {
        logger.error(`Erro ao executar ação ${action.type}:`, actionError);
      }
    }
  }
  
  // Resto do código existente...
}

module.exports = BaileysAdapter;
```

### 4. Processador Vox

Interface com o serviço Vox:

```javascript
// src/services/voxProcessor.js

const axios = require('axios');
const config = require('../config/config');

class VoxProcessor {
  constructor() {
    this.voxApiUrl = config.vox.apiUrl;
    this.apiKey = config.vox.apiKey;
  }
  
  /**
   * Processa mensagem através do Vox
   * @param {Object} message - Mensagem no formato Vox
   * @param {Object} context - Contexto da conversa
   * @returns {Promise<Object>} Resposta do Vox
   */
  async processMessage(message, context) {
    try {
      const response = await axios.post(
        `${this.voxApiUrl}/process`,
        {
          message,
          context,
          channel: 'whatsapp',
          sessionId: context.contextId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
      
    } catch (error) {
      logger.error('Erro ao processar mensagem com Vox API:', error);
      
      // Resposta de fallback em caso de erro
      return {
        text: 'Desculpe, estou tendo dificuldades para processar sua mensagem no momento.',
        actions: []
      };
    }
  }
}

module.exports = new VoxProcessor();
```

## Configurações Necessárias

Adicionar as seguintes configurações em `config.js`:

```javascript
// Em config.js, adicionar:

vox: {
  apiUrl: process.env.VOX_API_URL || 'http://localhost:3050/api/v1',
  apiKey: process.env.VOX_API_KEY || 'default-dev-key',
  contextTtl: parseInt(process.env.VOX_CONTEXT_TTL || '86400', 10), // 24 horas
  maxHistoryLength: parseInt(process.env.VOX_MAX_HISTORY_LENGTH || '50', 10),
  defaultLanguage: process.env.VOX_DEFAULT_LANGUAGE || 'pt-BR',
  fallbackEnabled: process.env.VOX_FALLBACK_ENABLED !== 'false',
  serviceEndpoints: {
    processMessage: '/process',
    manageTasks: '/tasks',
    manageKnowledge: '/knowledge'
  }
}
```

## Metadados e Reconhecimento de Canais

Para garantir que o Vox reconheça corretamente o canal e mantenha o contexto entre diferentes canais:

```javascript
// Exemplo de enriquecimento de metadados no mediador

_extractMetadata(whatsappMessage) {
  return {
    whatsapp: {
      messageType: whatsappMessage.type,
      fromGroup: whatsappMessage.chatId.endsWith('@g.us'),
      isForwarded: whatsappMessage.isForwarded,
      quotedMessageId: whatsappMessage.quotedMessageId,
      deviceType: this._detectDeviceType(whatsappMessage),
      businessInfo: whatsappMessage.businessInfo
    },
    user: {
      // Dados do usuário que podem ser recuperados de outros serviços
      // Implementação de enriquecimento com perfil do usuário
    }
  };
}
```

## Manutenção de Sessão Cross-Channel

Para permitir que uma conversa continue entre WhatsApp e outros canais:

```javascript
// Adaptação para recuperação de contexto cross-channel

async getOrCreateCrossChannelContext(userId, channelId) {
  // Tenta encontrar um contexto global para o usuário
  const globalContextKey = `user:${userId}:global`;
  let globalContextId = await redis.get(globalContextKey);
  
  if (!globalContextId) {
    // Cria um novo contexto global
    globalContextId = `global:${uuidv4()}`;
    await redis.set(globalContextKey, globalContextId);
  }
  
  // Associa o canal atual ao contexto global
  const channelKey = `channel:${channelId}`;
  await redis.set(channelKey, globalContextId);
  
  return this.getContext(globalContextId);
}
```

## Tratamento de Tipos de Mensagens Específicas do WhatsApp

```javascript
// Adaptação para suportar recursos específicos do WhatsApp

toVoxFormat(whatsappMessage) {
  // Código base de conversão...
  
  // Tratamento especial para diferentes tipos
  if (whatsappMessage.type === 'buttons') {
    return {
      // Formato básico...
      content: {
        type: 'buttons',
        text: whatsappMessage.body,
        options: whatsappMessage.buttons.map(b => ({
          id: b.id,
          text: b.displayText
        }))
      }
    };
  }
  
  if (whatsappMessage.type === 'list') {
    // Tratamento similar para listas
  }
  
  // Continua com o formato padrão...
}
```

## Padrões de Comunicação Assíncrona

Para mensagens que requerem processamento mais demorado:

```javascript
async processComplexRequest(message, context) {
  // Enviar confirmação imediata
  await this.sendText(
    message.chatId,
    "Estou processando sua solicitação, respondo em instantes..."
  );
  
  // Inicia processamento em background
  const taskId = await backgroundTaskService.startTask(async () => {
    try {
      const voxResponse = await voxProcessor.processMessage(message, context, {
        timeout: 30000 // Timeout estendido
      });
      
      // Envia resposta quando pronta
      const whatsappResponse = whatsappVoxMediator.toWhatsappFormat(voxResponse);
      await this.sendText(
        message.chatId, 
        whatsappResponse.content,
        whatsappResponse.options
      );
      
    } catch (error) {
      logger.error('Erro no processamento em background:', error);
      await this.sendText(
        message.chatId,
        "Desculpe, tive um problema ao processar sua solicitação. Pode tentar novamente?"
      );
    }
  });
  
  logger.info(`Tarefa em background iniciada: ${taskId}`);
  return taskId;
}
```

## Monitoramento e Logging

```javascript
// Adicionar instrumentação para monitoramento

const { performance } = require('perf_hooks');
const { Prometheus } = require('../utils/metrics');

const voxLatencyHistogram = new Prometheus.Histogram({
  name: 'vox_processing_latency_seconds',
  help: 'Latência de processamento do Vox',
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

async processMessage(message, context) {
  const startTime = performance.now();
  let success = false;
  
  try {
    // Processamento normal...
    success = true;
    return result;
  } catch (error) {
    // Tratamento de erro...
    throw error;
  } finally {
    const duration = (performance.now() - startTime) / 1000;
    voxLatencyHistogram.observe({ success, channel: 'whatsapp' }, duration);
    
    logger.debug(`Vox processou mensagem em ${duration.toFixed(3)}s (sucesso: ${success})`);
  }
}
```

## Próximos Passos

1. **Implementar API do Vox**: Desenvolver a API completa do serviço Vox
2. **Testes de Integração**: Criar suíte de testes automatizados para a integração
3. **Suporte a Templates e Listas**: Integrar recursos avançados do WhatsApp
4. **Gerenciamento de Mídia**: Aprimorar manipulação de mensagens com mídia
5. **Dashboard de Monitoramento**: Criar interface para visualizar métricas de integração

## Conclusão

Esta integração representa o primeiro passo concreto na direção de transformar o Vox no núcleo do AgentOS. Ao estabelecer essa conexão entre o WhatsApp e o Vox, criamos não apenas um canal de comunicação, mas uma base para a arquitetura centrada em assistência virtual que definirá o futuro da plataforma.

---

**Versão:** 1.0  
**Data:** 17 de Março de 2025  
**Autor:** Equipe AgentOS  
**Status:** Proposta Técnica
