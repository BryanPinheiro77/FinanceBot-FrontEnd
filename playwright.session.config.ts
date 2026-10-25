import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'session.spec.ts',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:3109', trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'node scripts/session-fixture-api.mjs',
      url: 'http://127.0.0.1:3999/health',
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --port 3109 --host 127.0.0.1',
      url: 'http://127.0.0.1:3109',
      reuseExistingServer: false,
      env: {
        FINANCEBOT_API_BASE_URL: 'http://127.0.0.1:3999',
        FINANCEBOT_WEB_ORIGIN: 'http://127.0.0.1:3109',
        VERCEL: '0',
      },
    },
  ],
})
