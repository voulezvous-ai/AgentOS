#!/bin/bash

echo "🔧 Iniciando setup do PromptOS + Standards for AgentOS..."

ZIP="agentos_standards_and_promptos.zip"
TMPDIR="agentos_tmp"

# 1. Descompactar
echo "📦 Descompactando $ZIP..."
unzip -q $ZIP -d $TMPDIR

# 2. Mover arquivos
echo "📁 Movendo arquivos para o repositório..."
mkdir -p ./agentos
mv $TMPDIR/standards_for_agentos.md ./agentos/
unzip -q $TMPDIR/promptos/promptos_microsservico.zip -d ./agentos/promptos

# 3. Criar nova branch
echo "🌱 Criando nova branch..."
git checkout -b feat/add-promptos-and-standards

# 4. Adicionar, commit e push
echo "💾 Commitando alterações..."
git add .
git commit -m "feat: Add PromptOS and Standards for AgentOS"
git push origin feat/add-promptos-and-standards

# 5. Abrir PR (se GitHub CLI disponível)
if command -v gh &> /dev/null
then
  echo "📩 Criando Pull Request via GitHub CLI..."
  gh pr create --title "feat: Add PromptOS and Standards for AgentOS" \
    --body "Adiciona o primeiro microsserviço conforme o novo padrão oficial do AgentOS. Inclui documentação de standards e CI/CD automatizado com registro de agente." \
    --label "microsservice,standards,ci-ready"
else
  echo "⚠️ GitHub CLI não encontrado. Crie a PR manualmente via GitHub."
fi

# 6. Limpeza
rm -rf $TMPDIR
echo "✅ Setup concluído com sucesso."

