$ eval "$(ssh-agent -s)"
> Agent pid 59566#!/bin/bash

# Script para configurar autenticação via GitHub App

# Diretório onde armazenar as chaves e configurações
CONFIG_DIR="$HOME/.github_app"
KEY_FILE="$CONFIG_DIR/private-key.pem"
CONFIG_FILE="$CONFIG_DIR/config.json"

# Criar diretório para configurações
mkdir -p "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"

echo "🔧 Configuração do GitHub App"
echo "============================="
echo ""
echo "Para usar um GitHub App, você precisa:"
echo "1. Criar um GitHub App em https://github.com/settings/apps/new"
echo "2. Gerar uma chave privada para o App"
echo "3. Instalar o App no repositório desejado"
echo ""

read -p "Digite o ID do GitHub App: " APP_ID
read -p "Digite o nome da instalação (geralmente o nome do repositório): " INSTALLATION_NAME
read -p "Digite o ID da instalação: " INSTALLATION_ID

echo ""
echo "🔑 Agora vamos configurar a chave privada"
echo "Você deve ter baixado um arquivo .pem da página do GitHub App"
echo ""

read -p "Digite o caminho completo do arquivo .pem: " PEM_PATH

if [ ! -f "$PEM_PATH" ]; then
  echo "❌ Arquivo não encontrado: $PEM_PATH"
  exit 1
fi

# Copiar a chave privada para o diretório de configuração
cp "$PEM_PATH" "$KEY_FILE"
chmod 600 "$KEY_FILE"

# Criar arquivo de configuração
cat > "$CONFIG_FILE" << EOF
{
  "app_id": "$APP_ID",
  "installation_id": "$INSTALLATION_ID",
  "installation_name": "$INSTALLATION_NAME",
  "private_key_path": "$KEY_FILE"
}
EOF

echo ""
echo "✅ Configuração concluída!"
echo "Configurações salvas em: $CONFIG_DIR"
echo ""
echo "Para usar o GitHub App para deploy, você precisa:"
echo "1. Instalar as dependências necessárias: npm install @octokit/auth-app octokit"
echo "2. Usar o módulo @octokit/auth-app para autenticação"
echo ""

# Criar um script de exemplo para usar o GitHub App
EXAMPLE_SCRIPT="$CONFIG_DIR/github_app_example.js"

cat > "$EXAMPLE_SCRIPT" << EOF
const { createAppAuth } = require('@octokit/auth-app');
const { Octokit } = require('octokit');
const fs = require('fs');
const path = require('path');

async function main() {
  const configPath = path.join('$CONFIG_DIR', 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const privateKey = fs.readFileSync(config.private_key_path, 'utf8');
  
  const auth = createAppAuth({
    appId: config.app_id,
    privateKey: privateKey,
    installationId: config.installation_id,
  });
  
  // Obter um token de acesso para a instalação
  const { token } = await auth({ type: 'installation' });
  
  // Usar o token com o Octokit
  const octokit = new Octokit({ auth: token });
  
  // Exemplo: obter informações do repositório
  const repoOwner = 'voulezvous-ai';
  const repoName = 'AgentOS';
  
  console.log(\`Obtendo informações do repositório \${repoOwner}/\${repoName}...\`);
  
  const { data } = await octokit.rest.repos.get({
    owner: repoOwner,
    repo: repoName,
  });
  
  console.log('Informações do repositório:');
  console.log(\`Nome: \${data.name}\`);
  console.log(\`Descrição: \${data.description}\`);
  console.log(\`URL: \${data.html_url}\`);
  console.log(\`Estrelas: \${data.stargazers_count}\`);
  console.log(\`Forks: \${data.forks_count}\`);
}

main().catch(error => {
  console.error('Erro:', error);
  process.exit(1);
});
EOF

chmod +x "$EXAMPLE_SCRIPT"

echo "Exemplo de script criado: $EXAMPLE_SCRIPT"
echo "Para testar, execute: node $EXAMPLE_SCRIPT"
