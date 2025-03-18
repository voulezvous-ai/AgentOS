#!/bin/bash

# Script para configurar chave SSH para GitHub

# Configurações
SSH_DIR="$HOME/.ssh"
KEY_NAME="github_agentos_key"
KEY_COMMENT="github-agentos-$(date +%Y%m%d)"
CONFIG_FILE="$SSH_DIR/config"

# Criar diretório SSH se não existir
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

echo "🔑 Gerando nova chave SSH para GitHub..."
ssh-keygen -t ed25519 -f "$SSH_DIR/$KEY_NAME" -N "" -C "$KEY_COMMENT"

# Adicionar a chave ao SSH agent
echo "🔄 Adicionando chave ao SSH agent..."
eval "$(ssh-agent -s)"
ssh-add "$SSH_DIR/$KEY_NAME"

# Verificar a fingerprint da chave
echo "🔍 Verificando fingerprint da chave..."
ssh-keygen -lf "$SSH_DIR/$KEY_NAME"

# Atualizar/criar arquivo de configuração SSH
echo "📝 Atualizando configuração SSH..."
if grep -q "Host github.com" "$CONFIG_FILE" 2>/dev/null; then
  echo "⚠️ Configuração para github.com já existe em $CONFIG_FILE"
  echo "⚠️ Adicionando nova configuração como github-agentos"
  cat >> "$CONFIG_FILE" << EOF

# AgentOS GitHub Configuration
Host github-agentos
    HostName github.com
    User git
    IdentityFile $SSH_DIR/$KEY_NAME
    IdentitiesOnly yes
EOF
else
  cat >> "$CONFIG_FILE" << EOF

# AgentOS GitHub Configuration
Host github.com
    HostName github.com
    User git
    IdentityFile $SSH_DIR/$KEY_NAME
    IdentitiesOnly yes
EOF
fi

# Exibir a chave pública para copiar para o GitHub
echo ""
echo "🔓 Chave pública para adicionar ao GitHub:"
echo "----------------------------------------"
cat "$SSH_DIR/${KEY_NAME}.pub"
echo "----------------------------------------"
echo ""
echo "✅ Configuração concluída!"
echo "Por favor, copie a chave pública acima e adicione-a às suas chaves SSH no GitHub:"
echo "https://github.com/settings/keys"
echo ""
echo "Para testar a conexão, execute:"
echo "ssh -T git@github.com"
