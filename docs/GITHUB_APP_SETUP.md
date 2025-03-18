# Configuração e Uso do GitHub App para CI/CD

Este guia explica como configurar um GitHub App para autenticação e deploy do AgentOS.

## Por que usar GitHub Apps?

GitHub Apps oferecem vantagens sobre chaves SSH pessoais e tokens de acesso pessoal:

- **Permissões granulares**: você pode limitar o acesso apenas aos recursos necessários
- **Maior segurança**: não está vinculado a uma conta pessoal
- **Auditabilidade**: rastreie facilmente ações realizadas pelo app
- **Gerenciamento central**: melhor para organizações e equipes

## Pré-requisitos

- Conta GitHub com permissões para criar GitHub Apps
- Node.js e npm instalados
- Acesso ao repositório onde o GitHub App será instalado

## Configuração do GitHub App

### 1. Criar um GitHub App

1. Acesse [GitHub Developer Settings](https://github.com/settings/apps/new)
2. Preencha as informações básicas:
   - **Nome do App**: AgentOS Deployer
   - **Descrição**: App para CI/CD do AgentOS
   - **URL da página inicial**: URL do seu projeto ou organização
   - **Webhook URL**: Pode ser deixado em branco para uso local
   - **Permissões**: Configure as seguintes permissões:
     - **Repositório**:
       - **Conteúdo**: Acesso de leitura e escrita
       - **Deployments**: Acesso de leitura e escrita
       - **Metadados**: Acesso de leitura
       - **Pull requests**: Acesso de leitura e escrita
       - **Webhooks**: Acesso de leitura e escrita
       - **Workflows**: Acesso de leitura e escrita
3. Clique em "Criar GitHub App"

### 2. Gerar uma Chave Privada

1. Após criar o app, vá para a página de configuração do app
2. Role até a seção "Chaves privadas"
3. Clique em "Gerar uma chave privada"
4. Um arquivo `.pem` será baixado automaticamente
5. Guarde esse arquivo em um local seguro

### 3. Instalar o GitHub App

1. Na página do GitHub App, clique em "Instalar App"
2. Escolha a conta onde deseja instalar o app
3. Selecione os repositórios onde o app terá acesso
4. Clique em "Instalar"
5. Anote o ID da instalação (você pode encontrá-lo na URL após a instalação)

### 4. Executar o Script de Configuração

1. Execute o script de configuração:
   ```bash
   chmod +x setup_github_app.sh
   ./setup_github_app.sh
   ```
2. Siga as instruções no terminal:
   - Informe o ID do App (disponível na página do app)
   - Informe o nome da instalação (geralmente o nome do repositório)
   - Informe o ID da instalação (obtido na etapa anterior)
   - Forneça o caminho para o arquivo `.pem` baixado

## Uso do GitHub App para Deploy

### Instalar as Dependências

```bash
npm install @octokit/auth-app octokit
```

### Executar o Script de Deploy

```bash
node deploy_with_github_app.js
```

Este script irá:
1. Autenticar com o GitHub App
2. Obter informações do repositório
3. Criar um deployment
4. Atualizar o status do deployment
5. Executar o processo de deployment (simulado)
6. Atualizar o status final do deployment

## Integração com CI/CD

Para integrar com um sistema CI/CD existente:

1. Armazene o arquivo `.pem` como um segredo seguro no seu sistema CI/CD
2. Adapte o script `deploy_with_github_app.js` para se integrar com seu fluxo de trabalho
3. Configure as variáveis de ambiente necessárias no seu sistema CI/CD

## Solução de Problemas

- **Erro de autenticação**: Verifique se o arquivo `.pem` está correto
- **Erro de permissão**: Verifique se o GitHub App tem as permissões necessárias
- **Erro de instalação**: Verifique se o app está instalado no repositório correto
- **Erro de API**: Verifique se os endpoints da API estão corretos

## Recursos Adicionais

- [Documentação do GitHub Apps](https://docs.github.com/pt/developers/apps)
- [Documentação do Octokit](https://github.com/octokit/octokit.js)
- [API de Deployments do GitHub](https://docs.github.com/pt/rest/deployments)
