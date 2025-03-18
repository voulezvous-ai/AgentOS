#!/bin/bash

# Script para testar a conexão SSH e fazer push para o GitHub

echo "🔍 Testando a conexão SSH com GitHub..."
ssh -T git@github-agentos

echo "📂 Listando os arquivos a serem commitados..."
git status

read -p "Continuar com o push? (s/n): " choice
if [[ "$choice" != "s" && "$choice" != "S" ]]; then
  echo "❌ Operação cancelada pelo usuário."
  exit 0
fi

echo "⬆️ Enviando commits para o GitHub..."
git push -u origin main

echo "✅ Operação concluída!"
