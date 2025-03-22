# Documentação do AgentOS

Este diretório contém toda a documentação do projeto AgentOS.

## Documentation Index

## General Documentation
- [README.md](../README.md)
- [Project Overview](Project_Overview.txt)
- [Deployment Guide](Deployment_Guide.txt)
- [CI/CD Guide](CI_CD_GUIDE.md)
- [Token Instructions](TOKEN_INSTRUCTIONS.md)

### WebSocket Documentation
- [WebSocket Changelog](CHANGELOG-WEBSOCKET.md)

### Integration Roadmaps
- [Vox Integration Roadmap](VOX-INTEGRATION-ROADMAP.md)

### Archived Documentation
- [Old Deployment Guides](deployment_guides_old/)

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
