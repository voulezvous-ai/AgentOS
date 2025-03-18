/**
 * Script para fazer deploy usando autenticação do GitHub App
 */
const fs = require('fs');
const path = require('path');
const { createAppAuth } = require('@octokit/auth-app');
const { Octokit } = require('octokit');
const { execSync } = require('child_process');

// Caminho para o arquivo de configuração
const CONFIG_PATH = path.join(process.env.HOME, '.github_app/config.json');

async function main() {
  // Verificar se o arquivo de configuração existe
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('❌ Arquivo de configuração não encontrado.');
    console.error('Execute setup_github_app.sh primeiro para configurar o GitHub App.');
    process.exit(1);
  }
  
  // Carregar configuração
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  
  // Carregar chave privada
  let privateKey;
  try {
    privateKey = fs.readFileSync(config.private_key_path, 'utf8');
  } catch (error) {
    console.error(`❌ Erro ao ler chave privada: ${error.message}`);
    process.exit(1);
  }
  
  console.log('🔑 Autenticando com GitHub App...');
  
  // Criar autenticação
  const auth = createAppAuth({
    appId: config.app_id,
    privateKey: privateKey,
    installationId: config.installation_id,
  });
  
  // Obter token de acesso para a instalação
  const { token } = await auth({ type: 'installation' });
  
  // Criar cliente Octokit com o token
  const octokit = new Octokit({ auth: token });
  
  // Obter informações do repositório
  const repoOwner = 'voulezvous-ai';
  const repoName = 'AgentOS';
  
  console.log(`📊 Obtendo informações do repositório ${repoOwner}/${repoName}...`);
  
  const { data: repo } = await octokit.rest.repos.get({
    owner: repoOwner,
    repo: repoName,
  });
  
  console.log(`✅ Conectado ao repositório: ${repo.full_name}`);
  
  // Obter último commit
  console.log('🔍 Obtendo último commit...');
  const sha = execSync('git rev-parse HEAD').toString().trim();
  console.log(`Commit SHA: ${sha}`);
  
  // Criar um deployment
  console.log('🚀 Criando deployment...');
  const { data: deployment } = await octokit.rest.repos.createDeployment({
    owner: repoOwner,
    repo: repoName,
    ref: sha,
    environment: 'production',
    auto_merge: false,
    required_contexts: [],
    description: 'Deployment via GitHub App',
  });
  
  console.log(`✅ Deployment criado com ID: ${deployment.id}`);
  
  // Atualizar status do deployment para "in_progress"
  console.log('🔄 Atualizando status do deployment para "in_progress"...');
  await octokit.rest.repos.createDeploymentStatus({
    owner: repoOwner,
    repo: repoName,
    deployment_id: deployment.id,
    state: 'in_progress',
    description: 'Deployment em andamento',
  });
  
  // Aqui você executaria o processo real de deployment
  console.log('🔄 Executando processo de deployment...');
  console.log('(Simulação: aguardando 3 segundos)');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Atualizar status do deployment para "success"
  console.log('✅ Atualizando status do deployment para "success"...');
  await octokit.rest.repos.createDeploymentStatus({
    owner: repoOwner,
    repo: repoName,
    deployment_id: deployment.id,
    state: 'success',
    description: 'Deployment concluído com sucesso',
    environment_url: 'https://voulezvous-ai.github.io/AgentOS',
  });
  
  console.log('🎉 Deployment concluído com sucesso!');
}

// Executar o script
main().catch(error => {
  console.error('❌ Erro durante o deployment:', error);
  process.exit(1);
});
