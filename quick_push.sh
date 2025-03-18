#!/bin/bash

# Script simples para push com token

echo "🔑 Digite seu token de acesso pessoal do GitHub:"
read -s TOKEN

if [ -z "$TOKEN" ]; then
  echo "❌ Token não fornecido. Abortando."
  exit 1
fi

# Configurar temporariamente o remote com o token
git remote set-url origin "https://${TOKEN}@github.com/voulezvous-ai/AgentOS.git"

# Fazer push
echo "⬆️ Enviando para o GitHub..."
git push origin main

# Restaurar a URL do remote para SSH para futuros comandos
git remote set-url origin "git@github.com:voulezvous-ai/AgentOS.git"

echo "✅ Push concluído com sucesso!"
