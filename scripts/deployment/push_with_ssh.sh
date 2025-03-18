#!/bin/bash

# Script para fazer push usando SSH com a chave específica para o AgentOS

REPO_PATH="/Users/Amarilho/Documents/AgentOS/AgentOS-main"
SSH_KEY="~/.ssh/agentos_deploy_key"
GIT_SSH_COMMAND="ssh -i $SSH_KEY -o IdentitiesOnly=yes"

cd "$REPO_PATH" || exit 1

echo "🔑 Usando chave SSH: $SSH_KEY"
echo "📝 Verificando status do repositório..."
git status

echo "⬆️ Enviando commits para o GitHub..."
GIT_SSH_COMMAND="$GIT_SSH_COMMAND" git push origin main

echo "✅ Pronto! Seus commits foram enviados para o GitHub (ou houve algum erro acima)."
