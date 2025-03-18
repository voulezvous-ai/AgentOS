#!/bin/bash

# Script para limpar arquivos grandes e fazer push para o GitHub

echo "🧹 Iniciando limpeza antes do push..."

# Verificar se há arquivos grandes
echo "🔍 Verificando arquivos maiores que 90MB..."
find . -type f -size +90M | grep -v ".git/" | while read file; do
  echo "❌ Arquivo grande encontrado: $file"
  git rm --cached "$file"
  echo "✅ Removido do controle de versão: $file"
  echo "$file" >> .gitignore
  echo "✅ Adicionado ao .gitignore: $file"
done

# Remover a pasta node_modules do controle de versão
echo "🧹 Removendo diretórios node_modules do controle de versão..."
find . -name "node_modules" -type d | grep -v ".git/" | while read dir; do
  git rm -r --cached "$dir" 2>/dev/null
  echo "✅ Removido do controle de versão: $dir"
  echo "$dir" >> .gitignore
  echo "✅ Adicionado ao .gitignore: $dir"
done

# Adicionar outros diretórios e arquivos a ignorar
echo "📝 Atualizando .gitignore com padrões comuns..."
cat >> .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# Build outputs
dist/
build/
out/

# Local environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Chrome/Puppeteer downloads
**/puppeteer-core/.local-chromium/

# Large binary files
*.zip
*.tar.gz
*.tgz
*.tar.bz2
*.dmg
*.iso
*.rar
*.7z
EOF

# Remover o arquivo específico mencionado no erro
CHROME_FILE="AgentOS-main/services/whatsapp-service/node_modules/puppeteer-core/.local-chromium"
if [ -d "$CHROME_FILE" ]; then
  git rm -r --cached "$CHROME_FILE" 2>/dev/null
  echo "✅ Removido diretório Chromium do controle de versão"
  echo "$CHROME_FILE" >> .gitignore
fi

# Commit das alterações no .gitignore
echo "💾 Commitando alterações no .gitignore..."
git add .gitignore
git commit -m "Atualização do .gitignore para excluir arquivos grandes e diretórios node_modules"

# Push para o GitHub
echo "⬆️ Enviando para o GitHub..."
git push origin main

# Resultado do push
PUSH_RESULT=$?

if [ $PUSH_RESULT -eq 0 ]; then
  echo "✅ Push concluído com sucesso!"
else
  echo "❌ Ocorreu um erro durante o push. Código de saída: $PUSH_RESULT"
fi
