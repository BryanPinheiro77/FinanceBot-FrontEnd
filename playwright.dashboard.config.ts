import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'dashboard.spec.ts',
  fullyParallel: true,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:3110', trace: 'retain-on-failure' },
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
      command: 'node scripts/session-fixture-api.mjs',
      url: 'http://127.0.0.1:3998/health',
      reuseExistingServer: false,
      env: { FIXTURE_PORT: '3998' },
    },
    {
      command: 'npm run dev -- --port 3110 --host 127.0.0.1',
      url: 'http://127.0.0.1:3110',
      reuseExistingServer: false,
      env: {
        FINANCEBOT_API_BASE_URL: 'http://127.0.0.1:3998',
        FINANCEBOT_WEB_ORIGIN: 'http://127.0.0.1:3110',
        VERCEL: '0',
      },
    },
  ],
})
