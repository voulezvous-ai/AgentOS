# Configuração do Serviço WebSocket

Este documento contém instruções para configurar e executar o serviço WebSocket do AgentOS.

## Pré-requisitos

- Node.js v16.0.0 ou superior
- MongoDB v4.4.0 ou superior (configurado como Replica Set para suporte a Change Streams)
- npm ou yarn para gerenciamento de pacotes

## Configuração Inicial

### 1. Instalação de Dependências

```bash
# Usando npm
npm install

# Usando yarn
yarn install
```

### 2. Configuração de Ambiente

Copie o arquivo `.env.example` para `.env` e ajuste as configurações conforme seu ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações específicas:

- `MONGODB_URI`: URI de conexão com o MongoDB
- `WS_PORT`: Porta para o servidor WebSocket
- `JWT_SECRET`: Chave secreta para tokens JWT
- Entre outras configurações...

### 3. Configuração do MongoDB com Replica Set

Para desenvolvimento local, você pode configurar um Replica Set simples com o MongoDB:

#### Usando Docker (recomendado)

```bash
docker-compose up -d mongodb
```

#### Configuração Manual

1. Crie diretórios para dados de cada instância:

```bash
mkdir -p ~/data/rs0-0 ~/data/rs0-1 ~/data/rs0-2
```

2. Inicie as instâncias do MongoDB:

```bash
mongod --replSet rs0 --port 27017 --dbpath ~/data/rs0-0 --bind_ip localhost
mongod --replSet rs0 --port 27018 --dbpath ~/data/rs0-1 --bind_ip localhost
mongod --replSet rs0 --port 27019 --dbpath ~/data/rs0-2 --bind_ip localhost
```

3. Configure o Replica Set:

```bash
mongosh --port 27017
```

No shell do MongoDB:

```javascript
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" }
  ]
})
```

## Execução

### Modo de Desenvolvimento

```bash
# Modo de desenvolvimento com nodemon (reinicia automaticamente ao alterar arquivos)
npm run dev

# OU
yarn dev
```

### Modo de Produção

#### Instância Única

```bash
# Iniciar uma única instância
npm run start:single

# OU
yarn start:single
```

#### Modo Cluster (recomendado para produção)

```bash
# Iniciar em modo cluster
npm run start

# OU
yarn start
```

## Diagnóstico

Para verificar se o ambiente está corretamente configurado:

```bash
# Executar diagnóstico
npm run diagnostic

# OU
yarn diagnostic
```

## Testes

```bash
# Executar todos os testes
npm test

# Executar testes com watch mode
npm run test:watch

# OU
yarn test
yarn test:watch
```

## Arquitetura

O serviço segue uma arquitetura em camadas:

- **Controllers**: Tratamento de requisições e respostas
- **Services**: Lógica de negócio
- **Repositories**: Acesso a dados
- **Models**: Definição de esquemas e modelos de dados
- **Utils**: Utilitários e funções auxiliares

## Suporte e Contribuição

Para sugestões, dúvidas ou problemas, abra uma issue no repositório do projeto.

As contribuições são bem-vindas! Por favor, siga o fluxo padrão de Fork → Branch → Pull Request.
