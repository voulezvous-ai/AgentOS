# Instruções para Criar e Usar um Token de Acesso Pessoal

## Passo 1: Criar o Token no GitHub

1. Acesse [GitHub.com](https://github.com) e faça login
2. Clique no seu avatar no canto superior direito → Settings
3. No menu lateral, desça até **Developer settings** (na parte inferior)
4. Clique em **Personal access tokens** → **Tokens (classic)**
5. Clique em **Generate new token** → **Generate new token (classic)**
6. Dê um nome como "AgentOS Development"
7. Para os escopos, selecione pelo menos "repo" para acesso completo aos repositórios
8. Clique em **Generate token**
9. **IMPORTANTE**: Copie o token gerado - você só o verá uma vez!

## Passo 2: Usar o Script para Fazer Push

Depois de obter o token, execute:

```bash
./push_with_token.sh SEU_TOKEN_AQUI
```

Substitua `SEU_TOKEN_AQUI` pelo token que você copiou do GitHub.

## Nota de Segurança

O token é equivalente à sua senha. Nunca o compartilhe ou adicione a repositórios públicos.

O script está configurado para usar o token apenas para o push imediato e depois remover a referência ao token da URL remota.
