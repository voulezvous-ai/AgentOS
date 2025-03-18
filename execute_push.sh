#!/bin/bash

# Substitua SEU_TOKEN_AQUI pelo token que você copiou do GitHub
TOKEN="SEU_TOKEN_AQUI"
REPO_PATH="/Users/Amarilho/Documents/AgentOS/AgentOS-main"

if [ "$TOKEN" = "SEU_TOKEN_AQUI" ]; then
  echo "❌ ERRO: Você precisa editar este arquivo e substituir 'SEU_TOKEN_AQUI' pelo token real!"
  echo "Por favor, abra este arquivo em um editor e substitua o token."
  exit 1
fi

cd "$REPO_PATH" || exit 1

echo "🔄 Configurando remote URL com o token..."
git remote set-url origin "https://$TOKEN@github.com/voulezvous-ai/AgentOS.git"

echo "⬆️ Enviando commits para o GitHub..."
git push -u origin main

echo "🔄 Restaurando URL do remote por segurança..."
git remote set-url origin "https://github.com/voulezvous-ai/AgentOS.git"

echo "✅ Pronto! Seus commits foram enviados para o GitHub."
