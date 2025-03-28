import subprocess
import sys
import os

# Configurações corretas
REPO_FORK = "git@github.com:danvoulez/ForkOS.git"
REPO_OFFICIAL = "git@github.com:voulezvous-ai/AgentOS.git"
DIR_NAME = "agentos-novo"

def run(command, cwd=None):
    print(f"\n> {command}")
    result = subprocess.run(command, shell=True, cwd=cwd)
    if result.returncode != 0:
        print(f"\n[ERRO] Falha ao executar: {command}")
        sys.exit(1)

def main():
    print("== AgentOS | Promotor de Fork para Repositório Oficial ==")

    # Proteção contra sobrescrever pasta
    if os.path.exists(DIR_NAME):
        print(f"\n[ABORTADO] A pasta '{DIR_NAME}' já existe. Apague ou escolha outro nome.")
        sys.exit(1)

    # Clona o fork atualizado
    run(f"git clone {REPO_FORK} {DIR_NAME}")

    repo_path = os.path.abspath(DIR_NAME)

    # Remove o origin antigo e adiciona o oficial
    run("git remote remove origin", cwd=repo_path)
    run(f"git remote add origin {REPO_OFFICIAL}", cwd=repo_path)

    # Garante branch main
    run("git checkout -B main", cwd=repo_path)

    # Push forçado
    run("git push origin main --force", cwd=repo_path)

    print("\n[SUCCESSO] Fork promovido com sucesso para o repositório oficial.")
    print("Você já pode conectar a Vercel, Railway ou outro CI/CD ao repositório oficial.")

if __name__ == "__main__":
    main()