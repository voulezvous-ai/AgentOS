#!/bin/bash

# Script para fazer push usando token de acesso pessoal
# Uso: ./push_with_token.sh SEU_TOKEN_AQUI

if [ $# -eq 0 ]; then
    echo "Por favor, forneça seu token de acesso pessoal como argumento."
    echo "Uso: ./push_with_token.sh SEU_TOKEN_AQUI"
    exit 1
fi

TOKEN=$1
USERNAME=$(git config user.name)

# Configura o remote URL com o token embutido
git remote set-url origin https://${USERNAME}:${TOKEN}@github.com/voulezvous-ai/AgentOS.git

# Tenta fazer o push
echo "Tentando fazer push para o repositório..."
git push -u origin main

# Configura o remote URL de volta para o formato normal (por segurança)
git remote set-url origin https://github.com/voulezvous-ai/AgentOS.git

echo "Processo concluído!"
