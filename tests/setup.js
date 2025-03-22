// tests/setup.js
// Configuração global para testes

process.env.NODE_ENV = 'test';

jest.mock('../common/config/database', () => ({
  connectDB: jest.fn().mockResolvedValue(true)
}));

jest.setTimeout(30000);

afterAll(async () => {
  // Limpeza de recursos
});
