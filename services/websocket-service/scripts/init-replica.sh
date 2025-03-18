#!/bin/bash
# Script para inicializar o Replica Set do MongoDB

# Esperar pelo serviço MongoDB estar disponível
echo "Aguardando MongoDB inicializar..."
sleep 10

# Inicializar o Replica Set
echo "Inicializando Replica Set..."
mongosh --host mongodb:27017 -u admin -p password --authenticationDatabase admin <<EOF
  rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "mongodb:27017" }
    ]
  });
EOF

echo "Replica Set inicializado com sucesso!"

# Configuração adicional se necessário
echo "Verificando status do Replica Set..."
mongosh --host mongodb:27017 -u admin -p password --authenticationDatabase admin --eval "rs.status()"
