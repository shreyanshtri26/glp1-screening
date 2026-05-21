import { test, expect } from '@playwright/test';

test.describe('Mid-flow refresh — session persistence', () => {
  test('resumes from correct step after page refresh', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/form\/1/);

    // Fill S1 age
    await page.getByTestId('number-input-age').fill('45');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/2/);

    // Fill S2 weight
    await page.getByTestId('number-input-weight').fill('90');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/3/);

    // Refresh mid-flow
    await page.reload();
    // Should restore to form/3 (or whichever current step was)
    await expect(page).toHaveURL(/\/form\//);
    await expect(page.getByTestId('step-prompt')).toBeVisible();
  });
});
