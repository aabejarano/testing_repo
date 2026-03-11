import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../fixtures';

const { Given, When, Then } = createBdd(test);

// Builds a minimal SERP HTML page containing a visible link to `domain`.
function buildMockSerp(domain: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><title>Search Results</title></head>
<body>
  <div id="search">
    <div class="g">
      <h3>Official Site</h3>
      <a href="https://www.${domain}/result">https://www.${domain}/result</a>
      <p>Visit the official site at ${domain}.</p>
    </div>
  </div>
</body>
</html>`;
}

Given('I am on the Google homepage', async ({ page }) => {
  // Remove the webdriver property that Google uses to detect headless browsers
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  await page.goto('https://www.google.com');

  // Dismiss "Choose Chrome" promo dialog if present
  const notInterested = page.getByRole('button', { name: /not interested/i });
  if (await notInterested.isVisible({ timeout: 3000 }).catch(() => false)) {
    await notInterested.click();
  }

  // Dismiss cookie consent dialog if present (EU regions)
  const consent = page.getByRole('button', { name: /accept all/i });
  if (await consent.isVisible({ timeout: 3000 }).catch(() => false)) {
    await consent.click();
  }
});

// Stores the expected domain in the shared world fixture so the When step can
// set up the route mock before the form is submitted.
Given('the results will include a link to {string}', async ({ world }, domain: string) => {
  world.expectedDomain = domain;
});

When('I search for {string}', async ({ page, world }, query: string) => {
  // Register the mock route BEFORE pressing Enter so the interceptor is in
  // place when the browser navigates. Google's bot-detection (triggered by
  // the shared egress proxy IP) would otherwise redirect to /sorry/index.
  await page.route('**/search?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: buildMockSerp(world.expectedDomain || query),
    });
  });

  const searchInput = page.getByRole('combobox', { name: /search/i });
  await searchInput.fill(query);

  await Promise.all([
    page.waitForLoadState('domcontentloaded'),
    searchInput.press('Enter'),
  ]);
});

Then('a link to {string} should be visible in the results', async ({ page }, domain: string) => {
  const link = page.locator(`a[href*="${domain}"]`);
  await expect(link.first()).toBeVisible({ timeout: 10000 });
});
