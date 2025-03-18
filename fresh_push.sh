#!/bin/bash

# Script para criar um novo repositório limpo e fazer push apenas dos arquivos necessários

echo "🔄 Preparando repositório limpo para push..."

# Diretório de trabalho atual
CURRENT_DIR=$(pwd)
PARENT_DIR=$(dirname "$CURRENT_DIR")
TEMP_DIR="$PARENT_DIR/AgentOS-Clean"

# Criar diretório temporário
echo "📁 Criando diretório temporário: $TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Copiar apenas arquivos importantes (ignorando node_modules e outros arquivos grandes)
echo "📋 Copiando arquivos importantes..."
rsync -a --exclude="node_modules" --exclude=".git" --exclude="*.framework" --exclude="*/.local-chromium" \
     --exclude="*.zip" --exclude="*.tar.gz" --exclude="*.tgz" --exclude="dist" --exclude="build" \
     "$CURRENT_DIR/" "$TEMP_DIR/"

# Inicializar novo repositório Git
echo "🔄 Inicializando novo repositório Git..."
cd "$TEMP_DIR" || exit 1
git init

# Criar .gitignore adequado
echo "📝 Criando .gitignore..."
cat > .gitignore << EOF
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
*.framework
EOF

# Adicionar todos os arquivos
echo "➕ Adicionando arquivos ao controle de versão..."
git add .

# Commit inicial
echo "💾 Criando commit inicial..."
git commit -m "Initial commit - Clean repository"

# Adicionar remote
echo "🔗 Configurando remote..."
git remote add origin git@github.com:voulezvous-ai/AgentOS.git

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
  echo "📁 O repositório limpo está em: $TEMP_DIR"
else
  echo "❌ Ocorreu um erro durante o push. Código de saída: $PUSH_RESULT"
fi
