import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
  resolve: {
    alias: {
      '@woodie/domain': resolve(__dirname, '../packages/domain/dist'),
      '@woodie/application': resolve(__dirname, '../packages/application/dist'), 
      '@woodie/infrastructure': resolve(__dirname, '../packages/infrastructure/dist'),
      '@woodie/api': resolve(__dirname, '../packages/api/dist'),
    }
  }
});