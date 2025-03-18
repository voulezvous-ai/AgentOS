# Serviço WebSocket do AgentOS

Este serviço implementa a comunicação em tempo real via WebSockets para o AgentOS, utilizando MongoDB Change Streams para notificações em tempo real entre clientes conectados.

## Nova Arquitetura (v1.1.0)

A arquitetura foi refatorada para seguir padrões de design modernos, com clara separação de responsabilidades e componentes bem definidos:

```plaintext
├── src/
│   ├── config/           # Configurações do serviço
│   ├── controllers/      # Controladores da aplicação
│   ├── middlewares/      # Middlewares para Express e WebSocket
│   ├── models/           # Modelos de dados e esquemas
│   ├── repositories/     # Acesso a dados e persistência
│   ├── services/         # Lógica de negócio
│   ├── utils/            # Utilitários e helpers
│   ├── scripts/          # Scripts de utilidade e diagnóstico
│   ├── server.js         # Ponto de entrada principal
│   └── cluster.js        # Configuração de cluster para escala
├── logs/                 # Logs do sistema
└── tests/                # Testes unitários e de integração
```

### Arquitetura de Comunicação em Tempo Real

```ascii
┌────────────┐    ┌─────────────────────────────────────┐    ┌──────────────┐
│            │    │            WebSocket Service        │    │              │
│  Cliente   │◄──►│ ┌─────────┐  ┌──────────────────┐  │◄──►│   MongoDB    │
│  Frontend  │    │ │WebSocket│  │MessageService    │  │    │  (Replica Set)│
│            │    │ │Service  │◄─┤MessageRepository │  │    │              │
└────────────┘    │ └─────────┘  └──────────────────┘  │    └──────────────┘
                   │      ▲                ▲            │          ▲
                   │      │                │            │          │
                   │      ▼                │            │          │
                   │┌─────────────┐        │            │          │
                   ││             │        │            │          │
                   ││ Controller  │◄───────┘            │          │
                   ││ Layer       │                      │          │
                   │└─────────────┘                      │          │
                   │                                     │          │
                   │           ┌───────────────┐         │          │
                   │           │ChangeStream   │◄────────┘          │
                   │           │Monitor        │                     │
                   │           └───────────────┘                     │
                   └─────────────────────────────────────┘           │
                                                                    │
                              Notificações em tempo real◄────────────┘
```

## Padrões Implementados

- **Padrão Repository**: Separação entre lógica de negócio e acesso a dados
- **Padrão Service**: Encapsulamento da lógica de negócio em serviços especializados
- **Injeção de Dependências**: Componentes desacoplados e testáveis
- **Observer Pattern**: Sistema de notificações baseado em eventos para mudanças nos dados
- **Factory Pattern**: Criação de objetos desacoplada da implementação

## Principais Funcionalidades

- WebSockets para comunicação em tempo real entre clientes
- Suporte a múltiplos canais (VOX, couriers, etc.)
- Armazenamento de histórico de mensagens no MongoDB
- Notificações em tempo real via MongoDB Change Streams
- Controle de status de mensagens (lidas, entregues)
- Autenticação via JWT para segurança das conexões
- Logging centralizado e estruturado para monitoramento
- Escala horizontal com suporte a múltiplas instâncias via Cluster
- Desligamento gracioso para gerenciamento de recursos
- Diagnóstico e monitoramento de serviços

## MongoDB Change Streams

Este serviço utiliza Change Streams do MongoDB, que requer:

1. Um MongoDB configurado como Replica Set (mínimo de 3 nós)
2. Conexão usando um driver compatível (mongoose)
3. Pipeline de agregação para filtrar eventos relevantes

### Como funciona

1. O serviço conecta ao MongoDB e cria um Change Stream para cada canal ativo
2. Quando um documento é inserido/atualizado, o Change Stream emite um evento
3. O servidor WebSocket recebe o evento e notifica os clientes conectados
4. Os clientes atualizam sua interface em tempo real

## Requisitos

- Node.js 16+
- MongoDB 4.0+ configurado como Replica Set
- Dependências NPM conforme package.json

## Configuração

Configure as variáveis de ambiente no arquivo `.env` (veja exemplo em `.env.example`).

### Variáveis de ambiente importantes

```env
# MongoDB
MONGODB_URI=mongodb://username:password@hostname:port/database
MONGO_REPLICA_SET_NAME=rs0

# WebSocket
WS_PORT=3002
WS_HOST=0.0.0.0
```

## Inicialização

```bash
# Em desenvolvimento
npm run dev

# Em produção
npm start

# No Railway
npm run start:railway
```

## Configuração da Infraestrutura no Railway

Para o correto funcionamento do Change Streams, o MongoDB deve ser configurado como um Replica Set. No Railway, isso é feito através da configuração de um serviço MongoDB com múltiplas réplicas.

### Passos para configuração

1. Configurar o plugin MongoDB no Railway com suporte a Replica Set
2. Configurar as variáveis de ambiente para conexão com o Replica Set
3. Implantar o serviço WebSocket com as variáveis de ambiente apropriadas

## Desenvolvimento Local com Change Streams

Para desenvolver e testar localmente com Change Streams, você precisa:

1. Configurar um MongoDB Replica Set local (mínimo 3 nós)
2. Conectar-se usando a string de conexão com parâmetro `replicaSet`

```bash
# Exemplo de comando para iniciar um Replica Set de desenvolvimento (requer MongoDB instalado)
mongod --replSet rs0 --port 27017 --dbpath /path/to/data1
mongod --replSet rs0 --port 27018 --dbpath /path/to/data2
mongod --replSet rs0 --port 27019 --dbpath /path/to/data3

# Inicializar o Replica Set
mongo --eval "rs.initiate()"
```

## Monitoramento

O serviço expõe um endpoint `/status` que pode ser usado para health checks e monitoramento.

## Resolução de Problemas

### Troubleshooting

1. **"ChangeStreamHistoryLost"**: Indica que o oplog do MongoDB foi truncado. Aumente o tamanho do oplog ou reduza o tempo entre reconexões.

2. **Problemas de conexão**: Verifique se a string de conexão inclui todos os nós do Replica Set e o parâmetro `replicaSet`.

3. **Mensagens duplicadas**: Verifique a lógica de deduplicação no controlador de mensagens.

## Recursos Adicionais

- [Documentação oficial do MongoDB Change Streams](https://docs.mongodb.com/manual/changeStreams/)
- [Documentação do Mongoose](https://mongoosejs.com/docs/api.html)
- [Documentação do ws (WebSocket)](https://github.com/websockets/ws)
