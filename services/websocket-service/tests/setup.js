/**
 * Configuração global para testes
 */

// Aumentar o timeout para testes que envolvem operações de banco de dados
jest.setTimeout(30000);

// Suprimir logs durante os testes
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn()
  }
}));

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.WS_PORT = '3035';  // Porta diferente para não conflitar com desenvolvimento
