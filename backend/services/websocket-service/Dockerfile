# Dockerfile para o serviço WebSocket do AgentOS
FROM node:16-alpine

# Configuração de ambiente
ENV NODE_ENV=production
WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache tini bash curl

# Copiar arquivos de configuração
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código-fonte
COPY . .

# Expor a porta do serviço
EXPOSE 3030

# Usar tini como entrypoint para lidar corretamente com sinais
ENTRYPOINT ["/sbin/tini", "--"]

# Comando para iniciar o serviço
CMD ["node", "src/cluster.js"]

# Metadados
LABEL maintainer="AgentOS Team"
LABEL version="1.1.0"
LABEL description="Serviço WebSocket para comunicação em tempo real no AgentOS"
