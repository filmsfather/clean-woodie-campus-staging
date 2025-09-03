import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@woodie/domain': path.resolve(__dirname, '../domain/src'),
      '@woodie/application': path.resolve(__dirname, '../application/src'),
      '@woodie/infrastructure': path.resolve(__dirname, '../infrastructure/src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
})