# Guia de CI/CD do AgentOS

Este documento descreve o pipeline de Integração Contínua (CI) e Entrega Contínua (CD) implementado para o projeto AgentOS.

## Visão Geral

O pipeline de CI/CD do AgentOS foi implementado utilizando GitHub Actions e Railway, oferecendo:

- Integração contínua com verificações automáticas de qualidade de código
- Testes automatizados em múltiplos níveis (unitários, integração, e2e)
- Deploy contínuo para ambientes de staging e produção
- Monitoramento e alertas automáticos

## Etapas do Pipeline

### 1. Verificação de Código

Para cada pull request e push em qualquer branch:

- **Linting**: ESLint verifica a qualidade e consistência do código
- **Formatação**: Prettier verifica se o código segue os padrões de formatação
- **Análise estática**: SonarCloud detecta problemas de qualidade, segurança e manutenção
- **Auditoria de segurança**: npm audit verifica vulnerabilidades nas dependências

### 2. Testes Automatizados

Executados após a verificação de código:

- **Testes unitários**: Verificam o funcionamento isolado de componentes
- **Testes de integração**: Verificam a interação entre múltiplos componentes
- **Testes E2E**: Simulam o comportamento do usuário em um ambiente completo
- **Testes de performance**: Verificam o desempenho do sistema sob carga

### 3. Build

Após os testes passarem:

- **Build dos artefatos**: Compilação de código para produção
- **Criação de imagens Docker**: Para serviços que utilizam containerização
- **Cache de artefatos**: Armazenamento eficiente de builds para acelerar deploys

### 4. Deploy

Acionado automaticamente para branches específicas:

- **Branch develop → Staging**
- **Branch main → Produção**

Ou manualmente via workflow_dispatch:

```bash
# via GitHub CLI
gh workflow run railway-deploy.yml -f environment=staging
# ou
gh workflow run railway-deploy.yml -f environment=production
```

#### API de Deployments do GitHub

O AgentOS utiliza a [API de Deployments do GitHub](https://docs.github.com/en/rest/deployments) para registrar e monitorar todos os deployments. Este sistema oferece:

- **Rastreabilidade**: Todos os deployments são registrados e associados a commits específicos
- **Status em tempo real**: Atualização do status durante todo o processo de deployment
- **Relatórios**: Histórico de deployments para auditoria e referência
- **URLs de ambiente**: Links diretos para os ambientes implantados

O fluxo de deployment utilizando esta API é:

1. Criação do deployment pelo GitHub Actions (`.github/workflows/auto-deploy.yml`)
2. Atualização do status para "in_progress"
3. Execução do deploy no Railway
4. Atualização final do status para "success" ou "failure"

Um script utilitário (`deployment-config.js`) fornece funções para interagir com esta API programaticamente.

## Ambientes

### Staging

- URL: [https://agentos-staging.up.railway.app](https://agentos-staging.up.railway.app)
- Propósito: Testes de aceitação, demonstrações, validação pré-produção
- Configuração: Recursos reduzidos para economia de custos

### Produção

- URL: [https://agentos.up.railway.app](https://agentos.up.railway.app)
- Propósito: Ambiente de produção para uso real
- Configuração: Alta disponibilidade com replicação e auto-scaling

## Infraestrutura como Código

Toda a configuração de infraestrutura é versionada nos seguintes arquivos:

- `.github/workflows/`: Configuração do GitHub Actions
  - `railway-deploy.yml`: Pipeline principal de deploy
  - `auto-deploy.yml`: Pipeline automatizado usando GitHub Deployments API
- `railway.json`: Configuração do Railway
- `nixpacks.toml`: Configuração de build e runtime
- `docker-compose.yml`: Configuração para ambiente de desenvolvimento
- `deployment-config.js`: Funções utilitárias para interagir com a API de Deployments

## Monitoramento e Logs

- **Métricas**: Prometheus integrado ao Railway
- **Logs**: Loki para agregação de logs
- **Tracing**: Jaeger para rastreamento distribuído
- **Alertas**: Configurados para falhas de deploy e problemas operacionais

## Change Streams e WebSockets

Para o serviço de WebSocket com Change Streams MongoDB:

1. **CI**: Testes específicos com MongoDB Replica Set
2. **CD**: Deploy configurado para garantir alta disponibilidade
3. **Monitoramento**: Métricas específicas para WebSockets e Change Streams
4. **Rollback**: Estratégia de rollback automático em caso de falha

## Práticas Recomendadas

1. **Branches de curta duração**: Mantenha PRs pequenos e focados
2. **Testes locais**: Execute `npm test` antes de enviar código
3. **Mensagens de commit**: Siga o padrão conventional commits
4. **Documentação**: Atualize a documentação junto com mudanças de código

## Troubleshooting

### Falhas no Pipeline

1. Verifique os logs detalhados no GitHub Actions
2. Confirme que testes estão passando localmente
3. Verifique se o Railway Token está configurado

### Problemas de Deploy

1. Verifique a seção de logs no Railway
2. Confirme que o MongoDB Replica Set está operacional
3. Verifique o endpoint de saúde (/status) dos serviços

## Roadmap de CI/CD

- [x] Implementar integração com a API de Deployments do GitHub
- [ ] Implementar testes de carga automatizados
- [ ] Adicionar análise de cobertura de código com limites mínimos
- [ ] Implementar feature flags para lançamentos graduais
- [ ] Configurar canary releases para mitigação de riscos

## Documentação Detalhada

Para informações mais detalhadas sobre o sistema de deployment automatizado, consulte o [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md), que contém:

- Explicação detalhada da integração com a API de Deployments do GitHub
- Instruções para configurar secrets e tokens necessários
- Guia de solução de problemas para deployments
- Exemplos de uso programático do sistema de deployment

## Integração com Vox

O sistema de CI/CD será integrado com o Vox, permitindo:

- **Monitoramento de Deployments**: Vox pode relatar o status atual de deployments via chat
- **Comandos de Deployment**: Iniciar deployments através de comandos de voz ou texto para o Vox
- **Alertas Inteligentes**: Notificações contextuais sobre falhas ou sucesso de deployments
- **Escalãvel**: Automaticamente escala problemas para a equipe adequada quando necessário

Esta integração está detalhada no [VOX-INTEGRATION-ROADMAP.md](./VOX-INTEGRATION-ROADMAP.md) como parte da estratégia de centralização do Vox no ecossistema AgentOS.
