#!/bin/bash

# Gera uma passphrase segura de 32 caracteres
PASSPHRASE=$(openssl rand -base64 32)

# Salva a senha em um arquivo seguro
echo "$PASSPHRASE" > my_passphrase.txt
chmod 600 my_passphrase.txt  # Protege o arquivo para que apenas o dono possa acessá-lo

# Exibe a senha no terminal
echo "🔑 Sua passphrase foi gerada com sucesso!"
echo "---------------------------------------"
echo "$PASSPHRASE"
echo "---------------------------------------"
echo "✅ Sua passphrase também foi salva no arquivo: my_passphrase.txt"
echo "⚠️ Guarde essa senha com segurança!"
