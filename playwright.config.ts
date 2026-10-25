import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testIgnore: 'session.spec.ts',
  fullyParallel: true,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:3108', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
    {
      name: 'reduced-motion',
      use: { viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3108 --host 127.0.0.1',
    url: 'http://127.0.0.1:3108',
    reuseExistingServer: !process.env.CI,
  },
})
