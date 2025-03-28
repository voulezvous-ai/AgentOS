
# AgentOS Vision

Microsserviço de dashboard para visualizar dados em tempo real do AgentOS.

## Como rodar

1. Instale as dependências:
```bash
pip install -r requirements.txt
```

2. Rode o servidor:
```bash
uvicorn main:app --reload
```

3. Acesse em [http://localhost:8000/dashboard](http://localhost:8000/dashboard)
