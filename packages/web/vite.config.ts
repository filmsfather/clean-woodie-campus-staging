import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 루트 디렉토리에서 환경변수 로드
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '')
  
  return {
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
    rollupOptions: {
      external: (id, _importer) => {
        // MSW 관련 모듈은 외부 의존성으로 처리하여 번들에서 제외
        if (id.includes('msw') && !id.includes('msw-storybook-addon')) {
          return true;
        }
        return false;
      },
      // 청크 최적화 
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['recharts'],
        },
      },
    },
    // 소스맵 생성 (스테이징 디버깅용)
    sourcemap: process.env.NODE_ENV !== 'production',
  },
  define: {
    // 환경별 컴파일 타임 상수
    __MSW_ENABLED__: JSON.stringify(
      mode === 'development' && 
      env.VITE_MSW_ENABLED !== 'false'
    ),
    __STORYBOOK_ENABLED__: JSON.stringify(env.VITE_STORYBOOK_ENABLED === 'true'),
    __DEV_TOOLS_ENABLED__: JSON.stringify(env.VITE_ENABLE_DEV_TOOLS === 'true'),
  },
  // 환경변수 디렉토리 설정
  envDir: path.resolve(__dirname, '../..'),
  }
})