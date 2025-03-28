# Testes – Frontend Unificado

## Testes disponíveis

- `build.test.js` — Verifica se o build do frontend ocorre sem erros
- `healthcheck.test.js` — Verifica se o serviço responde corretamente após inicialização

## Como rodar

```bash
cd frontend
npm install
npm run build
cd ..
npm install jest supertest
jest tests/
```