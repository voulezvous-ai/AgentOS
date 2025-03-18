# Guia do Baileys WhatsApp API no AgentOS

## Visão Geral
Este documento descreve a implementação do Baileys WhatsApp API no AgentOS, atualizado para a versão 6.7.16+ da biblioteca [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys).

## Versão do Baileys
- **Versão atual**: 6.7.16
- **Repositório**: [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys)

> Nota: Este projeto migrou do `@adiwajshing/baileys` para `@whiskeysockets/baileys` para manter compatibilidade e receber atualizações.

## Características Principais
- Suporte completo para WhatsApp Multi-Device (MD)
- Não requer Selenium ou qualquer outro navegador
- Comunicação direta via WebSocket com a API do WhatsApp Web
- Suporte para múltiplas contas simultâneas
- Compatibilidade com a versão mais recente da API do WhatsApp

## Melhores Práticas Implementadas

### 1. Gestão de Conexão
- **Reconexão Inteligente**: Implementação de lógica para tentar reconectar apenas quando apropriado
- **Verificação de Tipo de Erro**: Análise cuidadosa dos erros de desconexão para evitar bans
- **Delay na Reconexão**: Adição de delay entre tentativas de reconexão para evitar sobrecarregar os servidores

### 2. Otimizações de Desempenho
- **@cacheable/node-cache**: Substituição do antigo `node-cache` pelo mais mantido e eficiente `@cacheable/node-cache` 
- **Cache de Chaves**: Implementação de `makeCacheableSignalKeyStore` para armazenamento otimizado de chaves
- **Gestão de Memória**: Configurações para limitar o histórico sincronizado quando desnecessário

### 3. Prevenção de Banimento
- **Controle de Taxas de Envio**: Limitação de número de mensagens por período
- **Identificação do Cliente**: Configuração adequada de informações do navegador
- **Manipulação Adequada de Ausência de Mensagens**: Tratamento correto para casos onde getMessage não encontra mensagens

### 4. Funcionalidades Novas
- **Suporte para Respostas Encadeadas**: Capacidade de citar mensagens anteriores
- **Controle Avançado de Leitura de Mensagens**: Opções para marcar mensagens específicas como lidas
- **Monitoramento de Eventos**: Handlers para diversos tipos de eventos como atualizações de chat e contatos

## Variáveis de Ambiente

Novas variáveis de ambiente adicionadas:
- `AUTO_READ_MESSAGES`: Marca mensagens como lidas automaticamente (default: false)
- `SYNC_FULL_HISTORY`: Sincroniza histórico completo (default: false, use com cuidado)
- `WHATSAPP_RECONNECT_INTERVAL`: Intervalo para reconexão em ms (default: 2000)
- `WHATSAPP_MAX_RECONNECT_ATTEMPTS`: Tentativas máximas de reconexão (default: 5)
- `USE_LATEST_WAWEB_VERSION`: Usa a versão mais recente da API WhatsApp Web (default: true)
- `WHATSAPP_TRANSACTION_TIMEOUT`: Timeout para transações em ms (default: 30000)
- `MESSAGE_RETRY_COUNTER_CACHE_TTL`: TTL do cache para contadores de retry em segundos (default: 3600)

## Utilização de Múltiplas Instâncias

Para gerenciar múltiplas contas WhatsApp simultaneamente:

```javascript
// Exemplo de criação de múltiplas instâncias
const BaileysAdapter = require('./adapters/baileysAdapter');

// Cliente 1
const client1 = new BaileysAdapter({ 
  clientId: 'whatsapp-client-1'
});
await client1.initialize();

// Cliente 2 
const client2 = new BaileysAdapter({ 
  clientId: 'whatsapp-client-2'
});
await client2.initialize();
```

## Limitações Conhecidas
- Não suporta WhatsApp Business API (WABA) - apenas WhatsApp normal
- Não implementa todas as funcionalidades de grupos disponíveis no WhatsApp
- A biblioteca Baileys pode ocasionalmente quebrar com atualizações do WhatsApp

## Referências
- [Documentação oficial do Baileys](https://guide.whiskeysockets.io/)
- [API de referência](https://baileys.whiskeysockets.io/)
- [Repositório no GitHub](https://github.com/WhiskeySockets/Baileys)
