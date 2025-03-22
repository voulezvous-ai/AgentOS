# AgentOS-3

## Estrutura Atualizada

### Documentação
- Toda a documentação foi consolidada em `docs/`.

### Scripts
- Scripts organizados em `scripts/` com subpastas para funcionalidades específicas.

### Frontend
- Arquivos do frontend organizados em `frontend/` com subpastas para configuração, componentes e recursos estáticos.

### Backend
- Arquivos do backend organizados em `backend/` com subpastas para configuração, serviços e testes.

### Configuração de Deploy
- Arquivos de configuração de deploy movidos para `config/deployment/`.

### Arquivos Obsoletos
- Arquivos redundantes ou obsoletos foram movidos para `archive/` ou removidos.

## Estrutura do Projeto

A estrutura do projeto segue uma arquitetura limpa e modular:

```markdown
/AgentOS
├── docs/                 # Toda a documentação consolidada
│   ├── README.md         # Arquivo README movido para a pasta docs
├── backend/              # Toda a lógica de servidor
│   ├── src/              # Código-fonte principal
│   │   ├── domain/       # Entidades e regras de negócio
│   │   │   └── vox/      # Núcleo do sistema Vox
│   │   ├── application/  # Casos de uso
│   │   ├── infrastructure/ # Adaptadores e implementações
│   │   └── interfaces/   # Controllers e API
│   ├── services/         # Microserviços independentes
│   │   ├── vox-service/  # Serviço principal de IA
│   │   ├── audit-service/ # Logs e auditoria
│   │   ├── websocket-service/ # Comunicação em tempo real
│   │   ├── whatsapp-service/ # Integração com WhatsApp
│   │   ├── media-service/ # Processamento de mídia
│   │   ├── order-service/ # Gerenciamento de pedidos
│   │   ├── access-control/ # Controle de acesso e autenticação
│   └── tests/            # Testes categorizados
│       ├── unit/         # Testes unitários
│       ├── integration/  # Testes de integração
│       └── e2e/          # Testes end-to-end
├── frontend/             # Interface de usuário
│   ├── src/              # Código-fonte frontend
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── services/     # Serviços e API clients
│   │   └── styles/       # Estilização
│   └── public/           # Recursos estáticos
└── scripts/              # Scripts para automação
    ├── deployment/       # Scripts de deployment
    ├── github/           # Automação de CI/CD
    └── utils/            # Utilitários gerais
```

## Sistema VOX

O sistema VOX é nosso núcleo de inteligência conversacional, seguindo uma arquitetura limpa:

1. **Domain Layer**:
   - **Entidades**: Escalation, Action, Command, Context
   - **Serviços de Domínio**: PermissionService, ActionService, EscalationService, ContextService

2. **Application Layer**:
   - **Casos de Uso**: ProcessCommand, CheckEscalationStatus, RegisterContext

3. **Interfaces**:
   - **Controllers**: VoxController, EscalationController
   - **DTOs**: CommandDTO, ActionDTO, EscalationDTO

4. **Infrastructure**:
   - **Repositories**: ActionRepository, EscalationRepository, ContextRepository
   - **External Services**: AIService, NotificationService

## Iniciando o Projeto

Para iniciar o desenvolvimento:

```bash
# Instalar dependências
npm install

# Iniciar backend
cd backend
npm run dev

# Iniciar frontend (em outro terminal)
cd frontend
npm run dev
```

## Documentação

Para documentação detalhada, consulte a pasta [/docs](/docs/DOCUMENTATION_INDEX.md).

## Licença

Proprietary - Todos os direitos reservados.
