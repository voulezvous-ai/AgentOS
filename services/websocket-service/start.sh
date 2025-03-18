#!/bin/bash

# Script para iniciar o serviço WebSocket do AgentOS
# Este script é usado para desenvolvimento e produção

# Carrega variáveis de ambiente, se existirem
if [ -f "../../.env" ]; then
  echo "Carregando variáveis de ambiente de .env..."
  export $(grep -v '^#' ../../.env | xargs)
fi

# Define variáveis padrão se não estiverem definidas
export PORT=${PORT:-3002}
export NODE_ENV=${NODE_ENV:-development}
export MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/agentos}

echo "Iniciando o serviço WebSocket na porta $PORT em modo $NODE_ENV"

# Instala dependências, se necessário
if [ ! -d "node_modules" ]; then
  echo "Instalando dependências..."
  npm install
fi

# Inicia o serviço
node server.js
