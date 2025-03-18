# Guia de Deployment Automatizado para o AgentOS

Este guia explica como está configurado o sistema de deployment automatizado para o AgentOS, utilizando a API de Deployments do GitHub integrada com Railway.

## Visão Geral

O sistema de deployment automatizado do AgentOS segue este fluxo:

1. Quando o código é enviado para a branch `main`, um workflow do GitHub Actions é acionado
2. O workflow cria um novo deployment usando a API do GitHub
3. O status do deployment é atualizado para "in_progress"
4. O código é implantado no Railway
5. Com base no resultado, o status é atualizado para "success" ou "failure"

## Componentes do Sistema

### 1. GitHub Deployments API

A [API de Deployments do GitHub](https://docs.github.com/en/rest/deployments) permite:

- Registrar deployments para rastreabilidade
- Atualizar status de deployments (in_progress, success, failure, etc.)
- Vincular deployments a ambientes específicos
- Fornecer URLs para os ambientes implantados

### 2. GitHub Actions Workflow

O arquivo `.github/workflows/auto-deploy.yml` contém a configuração para o workflow de CI/CD que:

- É acionado em pushes para a branch main
- Cria um deployment no GitHub
- Atualiza o status do deployment
- Implanta no Railway
- Atualiza o status final

### 3. Script de Deployment

O arquivo `deployment-config.js` contém funções úteis para:

- Criar deployments
- Atualizar status
- Integrar com o Railway

## Configuração Necessária

Para utilizar este sistema, você precisa configurar:

1. **Secrets no GitHub**:
   - `GITHUB_TOKEN`: Automaticamente fornecido pelo GitHub Actions
   - `RAILWAY_TOKEN`: Seu token de API do Railway

2. **Permissões**:
   - O token do GitHub precisa ter permissão para criar deployments
   - O token do Railway precisa ter permissão para fazer deploy

## Como Usar

### Deployment Automático

Simplesmente faça push para a branch `main` e o deployment será iniciado automaticamente.

### Deployment Manual

1. Vá para a aba "Actions" no GitHub
2. Selecione o workflow "Auto Deploy"
3. Clique em "Run workflow"
4. Selecione a branch que deseja implantar
5. Clique em "Run workflow"

## Monitoramento

Você pode monitorar seus deployments:

1. Na aba "Deployments" do seu repositório no GitHub
2. No dashboard do Railway
3. Nos logs do GitHub Actions

## Solução de Problemas

Se um deployment falhar:

1. Verifique os logs do GitHub Actions para identificar onde ocorreu o erro
2. Verifique se os tokens estão configurados corretamente
3. Verifique se o Railway está configurado corretamente

## Recursos Adicionais

- [Documentação da API de Deployments do GitHub](https://docs.github.com/en/rest/deployments)
- [Documentação do GitHub Actions](https://docs.github.com/en/actions)
- [Documentação do Railway](https://docs.railway.app/)

## Mais Informações

Para obter mais detalhes técnicos sobre a implementação, consulte os arquivos:

- `.github/workflows/auto-deploy.yml`
- `deployment-config.js`
