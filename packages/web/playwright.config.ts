import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * UseCase 기반 시나리오 테스트를 위한 구성
 */
export default defineConfig({
  // 테스트 디렉토리
  testDir: './e2e',
  
  // 전역 설정
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // 리포터 설정
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  // 테스트 공통 설정
  use: {
    // Base URL - 개발 서버
    baseURL: 'http://127.0.0.1:5173',
    
    // 스크린샷 및 비디오 설정
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // 브라우저 설정
    headless: process.env.CI ? true : false,
  },

  // 프로젝트별 설정 (다양한 브라우저/디바이스 테스트)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 개발 서버 설정 (테스트 실행 시 자동 시작)
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});