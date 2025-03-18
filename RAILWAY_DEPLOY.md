# Deploy do AgentOS no Railway

Este guia explica como fazer o deploy completo do AgentOS na plataforma Railway, incluindo o frontend, serviços de backend e banco de dados MongoDB.

## Pré-requisitos

1. Uma conta no [Railway](https://railway.app/)
2. [Git](https://git-scm.com/) instalado
3. [Node.js](https://nodejs.org/) (versão 16 ou superior) instalado

## Deploy do MongoDB

O Railway oferece MongoDB como um serviço, o que facilita muito o setup:

1. Faça login no Railway
2. Clique em "New Project" > "Provision MongoDB"
3. **Importante**: Configure o MongoDB como Replica Set para suportar Change Streams:
   - Em "Settings" do seu MongoDB service, ative "Replica Set" nas opções avançadas
   - Recomenda-se configurar pelo menos 3 nós para garantir disponibilidade e suporte a Change Streams
4. Anote o URI de conexão para usar nas variáveis de ambiente

## Estrutura de Deploy

O AgentOS é estruturado para deployment em módulos distintos:

1. **Frontend**: Interface React/Vite
2. **Serviços de Backend**: 
   - `vox-service`
   - `websocket-service`
   - Outros serviços

## Deploy do Frontend

1. No Railway, crie um novo serviço:

   ```bash
   New Project > Deploy from GitHub
   ```

2. Selecione o repositório do AgentOS

3. Configure o serviço para o Frontend:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview`

4. Configure as variáveis de ambiente:
   ```
   PORT=3000
   NODE_ENV=production
   MONGODB_URI=<URI do MongoDB>
   ```

## Deploy do WebSocket Service

1. No mesmo projeto, adicione um novo serviço:

   ```bash
   New Service > Deploy from GitHub
   ```

2. Configure:
   - Root Directory: `services/websocket-service`
   - Build Command: `npm install`
   - Start Command: `NODE_ENV=production CLUSTER_MODE=true node cluster.js`

3. Configure as variáveis de ambiente:

   ```env
   PORT=3002
   NODE_ENV=production
   MONGODB_URI=<URI do MongoDB>
   MONGO_REPLICA_SET_NAME=rs0
   WORKER_THREADS=2
   CLUSTER_MODE=true
   ```

4. Verifique os recursos alocados:
   - Recomenda-se pelo menos 512MB de RAM
   - Configurar escalonamento automático se possível (via railway.json)

## Deploy do VOX Service

1. Adicione outro serviço:

   ```bash
   New Service > Deploy from GitHub
   ```

2. Configure:
   - Root Directory: `services/vox-service`
   - Build Command: `npm install`
   - Start Command: `node server.js`

3. Configure as variáveis de ambiente:

   ```env
   PORT=3001
   NODE_ENV=production
   MONGODB_URI=<URI do MongoDB>
   ```

## Configuração do Railway Domain

1. Na seção "Settings" do seu projeto Railway, você pode configurar domínios personalizados.
2. Para um deploy inicial, você pode usar o domínio fornecido pelo Railway.

## Verificar Deploy

1. Acesse o URL fornecido pelo Railway para o frontend
2. Teste as funcionalidades do chat VOX
3. Verifique os logs no Railway para cada serviço
4. Teste o diagnóstico de Change Streams acessando `/api/diagnostics/changestreams` no serviço WebSocket
5. Monitore a performance e escala automática no painel do Railway

## Troubleshooting

- **Problema de CORS**: Se ocorrerem erros de CORS, verifique se os serviços estão configurados para permitir solicitações do domínio frontend.

- **Change Streams não funcionando**: Verifique se:
  - MongoDB está configurado como Replica Set
  - A variável de ambiente `MONGO_REPLICA_SET_NAME` está configurada corretamente
  - URI de conexão inclui o parâmetro `replicaSet=rs0` (ou o nome do seu Replica Set)
  - O diagnóstico em `/api/diagnostics/changestreams` mostra status positivo

- **Perda de conexões WebSocket**:
  - Verifique os logs do servidor WebSocket
  - Aumente o valor de `pingInterval` e `pingTimeout` no WebSocket service
  - Ative o modo Cluster com múltiplos workers para melhor resiliência
  
- **Monitoramento**:
  - Use a rota `/status` para verificar a saúde do serviço WebSocket
  - Configure alertas no Railway para métricas de CPU e memória
  
  ```javascript
  // Em cada server.js
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  ```

- **Conexão WebSocket**: Se os WebSockets não estiverem conectando, verifique se o Railway está permitindo conexões WebSocket (eles são suportados por padrão).

- **Banco de dados**: Se houver problemas de conexão com o MongoDB, verifique a string de conexão e certifique-se de que o endereço IP do serviço está na lista de IPs permitidos do MongoDB.

## Configurações Adicionais

### Escalar Serviços

Railway permite escalar serviços horizontalmente. Para serviços com alto tráfego como o WebSocket:

1. Vá para a seção "Settings" do serviço
2. Ajuste "Replicas" para o número desejado

### Monitoramento

Railway fornece logs e métricas básicas. Para monitoramento avançado, considere integrar com:

- New Relic
- Datadog
- Sentry para rastreamento de erros

## Notas Importantes

- O Railway tem um tier gratuito com limitações. Para projetos de produção, você precisará usar um plano pago.
- Os serviços no Railway hibernam após períodos de inatividade no plano gratuito.
- Para aplicações de produção real, configure CI/CD adequadamente e considere estratégias de backup para o MongoDB.
