# Standards for AgentOS

O documento oficial que define como microsserviços devem ser projetados, implementados e integrados ao ecossistema do AgentOS.

---

## 📅 Versão
**1.0.0** - Primeiro release oficial

---

## ✨ Objetivo
Garantir que todos os microsserviços do AgentOS:
- Sigam um padrão organizacional claro
- Sejam interoperáveis
- Possuam instalação, execução e persistência previsíveis
- Estejam prontos para CI/CD e deploy imediato
- Se registrem automaticamente no sistema principal

---

## 📂 Estrutura Obrigatória de Microsserviço

```
agentos/<nome-do-microsservico>/
├── src/
│   ├── main.py               # Entrada (FastAPI)
│   └── ...
├── actions/                 # Módulos de ação (opcional)
├── Dockerfile               # Deploy containerizado
├── requirements.txt         # Dependências
├── railway.json             # Integração Railway (se aplicável)
├── README.md                # Documentação
└── tests/                   # (opcional, mas recomendado)
```

---

## ✅ Requisitos Mínimos
| Item                        | Obrigatório | Exemplo                            |
|-----------------------------|-------------|-------------------------------------|
| `main.py` com FastAPI       | ✅          | `src/main.py`                       |
| Rota HTTP funcional         | ✅          | `/status`, `/run`, `/prompt`        |
| Documentação clara         | ✅          | Resumo, rotas, funções no README     |
| CI/CD ativado               | ✅          | via GitHub Actions ou Railway       |
| Registro no sistema         | ✅          | POST `/registry/register`           |
| Persistência via Mongo       | ☑️         | `mongo.py` se relevante              |

---

## ♻️ Processo de Inclusão (Pull Request)
1. Desenvolvedor cria diretório novo em `agentos/<nome>`
2. Abre um Pull Request
3. CI executa:
   - Valida estrutura (`validate_agentos_standard.py`)
   - Executa testes e lint
   - Faz deploy (Railway ou Docker)
   - Registra microsserviço na API do AgentOS
4. PR recebe selo `Conforme Standards for AgentOS`

---

## 🚀 Registro Automático
Cada microsserviço deve, após subir, registrar-se:
```http
POST https://agentos.core/registry/register
{
  "agent_name": "promptos",
  "endpoint": "https://promptos.agentos.app/prompt",
  "version": "1.0.0",
  "description": "CLI inteligente do AgentOS"
}
```

---

## 📌 Validador de Conformidade
- Arquivo: `validate_agentos_standard.py`
- Checa:
  - Estrutura correta
  - Presença de arquivos essenciais
  - README com nome, finalidade, endpoint e exemplo de uso

---

## 🚀 CI/CD de Microsserviço

Arquivo padrão: `.github/workflows/agentos-ci.yml`
```yaml
on:
  pull_request:
    paths:
      - 'agentos/**'

jobs:
  validate-agentos-standard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Validar estrutura do microsserviço
        run: python scripts/validate_agentos_standard.py

      - name: Instalar dependências e testar
        run: |
          cd agentos/promptos
          pip install -r requirements.txt
          pytest || echo "Sem testes ainda"

      - name: Deploy no Railway
        run: |
          railway up --service=promptos --detach

      - name: Registrar agente
        run: curl -X POST https://agentos.core/registry/register \
          -H "Content-Type: application/json" \
          -d '{"agent_name": "promptos", "endpoint": "https://...", "version": "1.0.0"}'
```

---

> *"Microsserviços do AgentOS são organismos vivos em uma rede fractal. Este padrão é a membrana que garante sua comunicação, integração e vida em conjunto."*
