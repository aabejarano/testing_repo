import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// Parse proxy from environment (HTTPS_PROXY takes precedence over HTTP_PROXY).
// The env-level no_proxy includes *.google.com which causes Chrome to bypass
// the proxy and fail with ERR_NAME_NOT_RESOLVED. We override that here by
// configuring the proxy explicitly in Playwright with no Google bypass.
function buildProxyConfig() {
  const raw = process.env.HTTPS_PROXY || process.env.https_proxy ||
              process.env.HTTP_PROXY  || process.env.http_proxy;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return {
      server:   `${url.protocol}//${url.hostname}:${url.port}`,
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
    };
  } catch {
    return undefined;
  }
}

// BDD config: reads preprocessed (staged) feature files and generates Playwright specs.
// The preprocessor (scripts/preprocess-features.js) expands any
// Examples: {'datafile':'...'} references into real Gherkin tables first.
const testDir = defineBddConfig({
  features: '.features-staged/**/*.feature',
  steps: ['features/fixtures.ts', 'features/steps/**/*.ts'],
});

export default defineConfig({
  testDir,
  timeout: 30000,
  retries: 1,
  use: {
    headless: true,
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
    proxy: buildProxyConfig(),
    launchOptions: {
      args: [
        '--disable-quic',                             // Force TCP instead of UDP/QUIC (HTTP3)
        '--no-sandbox',                               // Required in restricted/container environments
        '--disable-dev-shm-usage',                    // Use /tmp instead of /dev/shm
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled', // Hide headless/automation signals
      ],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
