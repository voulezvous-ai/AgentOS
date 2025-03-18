# Documentação do AgentOS

Este diretório contém toda a documentação do projeto AgentOS.

## Índice de Documentação

### Guias de Implantação e DevOps
- [Guia de Implantação](./deployment_guides_old/DEPLOYMENT_GUIDE.md)
- [Guia de Implantação no Railway](./deployment_guides_old/RAILWAY_DEPLOY.md)
- [Instruções para Tokens](./TOKEN_INSTRUCTIONS.md)
- [Configuração de App GitHub](./GITHUB_APP_SETUP.md)
- [Guia de CI/CD](./CI_CD_GUIDE.md)

### Documentação Técnica
- [Visão Geral do Projeto](./Project_Overview.txt)
- [Roadmap de Integração VOX](./VOX-INTEGRATION-ROADMAP.md)
- [Changelog do WebSocket](./CHANGELOG-WEBSOCKET.md)

### Manuais e Instruções
- [README Principal](./README.md)

## Estrutura do Projeto

O projeto AgentOS segue uma arquitetura modular com clara separação entre frontend e backend:

```
/AgentOS
├── docs/             # Toda a documentação
├── backend/          # Código do servidor
│   ├── src/          # Código fonte
│   ├── services/     # Microserviços
│   └── tests/        # Testes
├── frontend/         # Interface de usuário
│   ├── src/          # Código fonte
│   └── tests/        # Testes
└── scripts/          # Scripts de utilidade
```

Para mais detalhes sobre a arquitetura, consulte a documentação técnica específica de cada componente.
