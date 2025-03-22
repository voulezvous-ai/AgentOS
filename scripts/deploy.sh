#!/bin/bash
# Script de deploy atualizado

echo "Iniciando o deploy..."
docker-compose up --build -d
echo "Deploy concluído com sucesso!"
