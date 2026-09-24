/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // O SDK do Firebase sozinho tem ~540 kB minificado (~160 kB gzip).
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Firebase e React mudam pouco: chunks separados aproveitam melhor o cache do navegador.
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[/\\]@?firebase/ },
            { name: 'react', test: /node_modules[/\\](react|react-dom|scheduler)[/\\]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
