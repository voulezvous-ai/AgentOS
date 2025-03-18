#!/bin/bash

# Este script utiliza um token de acesso pessoal do GitHub para fazer push

# Solicitar o token do usuário (sem exibi-lo na tela)
echo "🔑 Por favor, insira seu token de acesso pessoal do GitHub: "
read -s GITHUB_TOKEN

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Token não fornecido. Abortando."
  exit 1
fi

REPO_PATH="/Users/Amarilho/Documents/AgentOS/AgentOS-main"
cd "$REPO_PATH" || exit 1

echo "🔄 Configurando remote URL temporária com o token..."
# Usar um remote temporário para não modificar o remote original
git remote add temp_origin "https://${GITHUB_TOKEN}@github.com/voulezvous-ai/AgentOS.git"

echo "⬆️ Enviando commits para o GitHub..."
git push temp_origin main

echo "🧹 Removendo remote temporário..."
git remote remove temp_origin

echo "✅ Pronto! Seus commits foram enviados para o GitHub."
