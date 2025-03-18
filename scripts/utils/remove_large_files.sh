#!/bin/bash

# Script para remover arquivos grandes do histórico do Git e fazer push

echo "🗑️ Removendo arquivos grandes do histórico do Git..."

# Caminho para o arquivo grande que queremos remover
LARGE_FILE_PATH="AgentOS-main/services/whatsapp-service/node_modules/puppeteer-core/.local-chromium"

# Remover node_modules do histórico do git
echo "🔄 Removendo diretório node_modules do histórico do Git..."
git filter-branch --force --index-filter "git rm -r --cached --ignore-unmatch node_modules" --prune-empty --tag-name-filter cat -- --all

# Remover o arquivo grande específico do histórico do git
echo "🔄 Removendo arquivo Chromium do histórico do Git..."
git filter-branch --force --index-filter "git rm -r --cached --ignore-unmatch $LARGE_FILE_PATH" --prune-empty --tag-name-filter cat -- --all

# Limpar referências antigas e executar a coleta de lixo
echo "🧹 Limpando referências antigas e executando coleta de lixo..."
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now

# Adicionar arquivo/diretório ao .gitignore para garantir que não seja adicionado novamente
echo "📝 Atualizando .gitignore..."
echo "node_modules/" >> .gitignore
echo "$LARGE_FILE_PATH" >> .gitignore
echo "*.framework" >> .gitignore

# Commit das alterações no .gitignore
echo "💾 Commitando alterações no .gitignore..."
git add .gitignore
git commit -m "Atualização do .gitignore para excluir arquivos grandes e diretórios node_modules"

# Forçar push para o GitHub (isso sobrescreverá o histórico no remoto)
echo "⬆️ Forçando push para o GitHub..."
echo "⚠️ AVISO: Isso vai sobrescrever o histórico no repositório remoto!"
read -p "Continuar? (s/n): " choice
if [[ "$choice" != "s" && "$choice" != "S" ]]; then
  echo "❌ Operação cancelada pelo usuário."
  exit 0
fi

git push origin main --force

# Resultado do push
PUSH_RESULT=$?

if [ $PUSH_RESULT -eq 0 ]; then
  echo "✅ Push concluído com sucesso!"
else
  echo "❌ Ocorreu um erro durante o push. Código de saída: $PUSH_RESULT"
fi
