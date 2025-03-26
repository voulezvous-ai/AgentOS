
# Dockerfile para AgentOS - Railway-ready
FROM python:3.11-slim

WORKDIR /app
COPY . .

# Instalar dependências
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt || \
    pip install --no-cache-dir fastapi uvicorn[standard] pymongo gspread oauth2client openai gtts python-dotenv apscheduler

# Definir variável de ambiente para o Uvicorn
ENV PORT=8000

# Comando padrão de execução
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
