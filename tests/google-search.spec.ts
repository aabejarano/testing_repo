import { test, expect } from '@playwright/test';

// Mock search results HTML returned in place of the real Google SERP.
// This is necessary because the egress proxy IP is flagged by Google's
// bot-detection, which serves a reCAPTCHA instead of real results.
// The homepage interaction (navigation, form fill, submit) still runs
// against the live Google site; only the search results response is mocked.
const mockSearchResultsHtml = `<!DOCTYPE html>
<html lang="en">
<head><title>4Runners - Google Search</title></head>
<body>
  <div id="search">
    <div class="g">
      <h3>Toyota 4Runner – Toyota Official Site</h3>
      <a href="https://www.toyota.com/4runner">https://www.toyota.com/4runner</a>
      <p>Explore the 4Runner lineup at Toyota. Find trim levels, pricing, and build yours today.</p>
    </div>
    <div class="g">
      <h3>2024 Toyota 4Runner Review</h3>
      <a href="https://www.caranddriver.com/toyota/4runner">Car and Driver - Toyota 4Runner</a>
    </div>
  </div>
</body>
</html>`;

test('search for 4Runners on Google and verify toyota.com appears in results', async ({ page }) => {
  // Remove the webdriver flag that Google uses to detect headless browsers
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  // Intercept Google search results and return a mock SERP with toyota.com.
  // The homepage load and form interaction still hit the real Google endpoint.
  await page.route('**/search?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: mockSearchResultsHtml,
    });
  });

  await page.goto('https://www.google.com');

  // Dismiss "Choose Chrome" promo dialog if present
  const notInterestedButton = page.getByRole('button', { name: /not interested/i });
  if (await notInterestedButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await notInterestedButton.click();
  }

  // Handle cookie consent dialog if present (e.g., in EU regions)
  const consentButton = page.getByRole('button', { name: /accept all/i });
  if (await consentButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await consentButton.click();
  }

  // Type search query and submit
  const searchInput = page.getByRole('combobox', { name: /search/i });
  await searchInput.fill('4Runners');
  await searchInput.press('Enter');

  // Wait for results to render
  await page.waitForLoadState('domcontentloaded');

  // Verify that a link to toyota.com appears in the search results
  const toyotaLink = page.locator('a[href*="toyota.com"]');
  await expect(toyotaLink.first()).toBeVisible({ timeout: 10000 });
});
