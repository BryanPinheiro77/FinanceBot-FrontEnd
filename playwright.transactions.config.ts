import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'transactions.spec.ts',
  outputDir: './test-results/transactions',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:3111',
    locale: 'pt-BR',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: 'mobile',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'reduced-motion',
      use: { viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' },
    },
  ],
  webServer: [
    {
      command: 'node scripts/transaction-fixture-api.mjs',
      url: 'http://127.0.0.1:3997/health',
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --port 3111 --host 127.0.0.1',
      url: 'http://127.0.0.1:3111',
      reuseExistingServer: false,
      env: {
        FINANCEBOT_API_BASE_URL: 'http://127.0.0.1:3997',
        FINANCEBOT_WEB_ORIGIN: 'http://127.0.0.1:3111',
        VERCEL: '0',
      },
    },
  ],
})
