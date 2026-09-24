import { defineConfig } from 'vitest/config';

// Testes das firestore.rules: precisam do emulador rodando (veja o script test:rules).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 20_000,
    fileParallelism: false,
  },
});
