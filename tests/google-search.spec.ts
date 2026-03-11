import { test, expect } from '@playwright/test';

test('search for 4Runners on Google and verify toyota.com appears in results', async ({ page }) => {
  await page.goto('https://www.google.com');

  // Handle cookie consent dialog if present (e.g., in EU regions)
  const consentButton = page.getByRole('button', { name: /accept all/i });
  if (await consentButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await consentButton.click();
  }

  // Type search query and submit
  const searchInput = page.locator('input[name="q"]');
  await searchInput.fill('4Runners');
  await searchInput.press('Enter');

  // Wait for search results to load
  await page.waitForLoadState('networkidle');

  // Verify that a link to toyota.com appears in the search results
  const toyotaLink = page.locator('a[href*="toyota.com"]');
  await expect(toyotaLink.first()).toBeVisible({ timeout: 10000 });
});
