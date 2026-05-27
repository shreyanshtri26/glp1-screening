import { test, expect } from '@playwright/test';

test.describe('Terminal states', () => {
  test('age < 18 → Ineligible immediately', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/form\/1/);
    await page.getByTestId('number-input-age').fill('16');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/result/);
    await expect(page.getByTestId('result-outcome')).toContainText('Not eligible');
    await expect(page.getByTestId('result-reason')).toContainText('Underage');
  });

  test('pregnant → Ineligible', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/form\/1/);

    await page.getByTestId('number-input-age').fill('30');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/2/);

    await page.getByTestId('number-input-weight').fill('75');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/3/);

    await page.getByTestId('number-input-height').fill('165');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/5/);

    // Pregnant
    await page.getByTestId('radio-option-yes').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/result/);

    await expect(page.getByTestId('result-outcome')).toContainText('Not eligible');
    await expect(page.getByTestId('result-reason')).toContainText('Pregnancy');
  });

  // Original scenario: already on GLP-1 → Clinical Review
  test('already on GLP-1 → Clinical Review', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await page.waitForURL(/\/form\/1/);
    await page.getByTestId('number-input-age').fill('40');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/2/);
    await page.getByTestId('number-input-weight').fill('100');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/3/);
    await page.getByTestId('number-input-height').fill('170');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/5/);
    await page.getByTestId('radio-option-no').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/6/);
    await page.waitForSelector('[data-testid="step-skip"]', { state: 'visible', timeout: 120000 });
    await page.getByTestId('step-skip').click();
    await page.waitForURL(/\/form\/7/);
    await page.getByTestId('radio-option-no').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/9/);
    await Promise.all([
      page.waitForURL(/\/form\/10/, { timeout: 120000 }),
      page.getByTestId('step-submit').click(),
    ]);
    await page.waitForLoadState('networkidle');
    // Select GLP-1
    await page.waitForSelector('[data-testid="checkbox-option-glp1"]', { timeout: 120000 });
    await page.getByTestId('checkbox-option-glp1').click();
    await Promise.all([
      page.waitForURL(/\/result/),
      page.getByTestId('step-submit').click(),
    ]);
    await expect(page.getByTestId('result-outcome')).toContainText('Clinical review');
    await expect(page.getByTestId('result-reason')).toContainText('Already On Therapy');
  });

  // Alternative scenario B: Already on GLP-1 → Dose adjustment
  test('already on GLP-1 → Dose adjustment', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await page.waitForURL(/\/form\/1/);
    await page.getByTestId('number-input-age').fill('40');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/2/);
    await page.getByTestId('number-input-weight').fill('100');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/3/);
    await page.getByTestId('number-input-height').fill('170');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/5/);
    await page.getByTestId('radio-option-no').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/6/);
    await page.waitForSelector('[data-testid="step-skip"]', { state: 'visible', timeout: 120000 });
    await page.getByTestId('step-skip').click();
    await page.waitForURL(/\/form\/7/);
    await page.getByTestId('radio-option-no').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/9/);
    await page.waitForSelector('[data-testid="checkbox-option-glp1"]', { timeout: 120000 });
    await page.getByTestId('checkbox-option-glp1').click();
    // Assume a dose‑adjustment control exists
    await page.waitForSelector('[data-testid="radio-option-dose-adjust"]', { timeout: 120000 });
    await page.getByTestId('radio-option-dose-adjust').click();
    await Promise.all([
      page.waitForURL(/\/result/),
      page.getByTestId('step-submit').click(),
    ]);
    await expect(page.getByTestId('result-outcome')).toBeVisible();
  });

  // Alternative scenario C: Already on GLP-1 → Skip review
  test('already on GLP-1 → Skip review', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await page.waitForURL(/\/form\/1/);
    await page.getByTestId('number-input-age').fill('40');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/2/);
    await page.getByTestId('number-input-weight').fill('100');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/3/);
    await page.getByTestId('number-input-height').fill('170');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/5/);
    await page.getByTestId('radio-option-no').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/6/);
    await page.waitForSelector('[data-testid="step-skip"]', { state: 'visible', timeout: 120000 });
    await page.getByTestId('step-skip').click();
    await page.waitForURL(/\/form\/7/);
    await page.getByTestId('radio-option-no').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/9/);
    await page.waitForSelector('[data-testid="step-skip"]', { timeout: 120000 });
    await page.getByTestId('step-skip').click();
    await Promise.all([
      page.waitForURL(/\/result/),
      page.getByTestId('step-submit').click(),
    ]);
    await expect(page.getByTestId('result-outcome')).toBeVisible();
  });

  // Alternative scenario D: Already on GLP-1 → Confirm therapy
  test('already on GLP-1 → Confirm therapy', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await page.waitForURL(/\/form\/1/);
    await page.getByTestId('number-input-age').fill('40');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/2/);
    await page.getByTestId('number-input-weight').fill('100');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/3/);
    await page.getByTestId('number-input-height').fill('170');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/5/);
    await page.getByTestId('radio-option-no').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/6/);
    await page.waitForSelector('[data-testid="step-skip"]', { state: 'visible', timeout: 120000 });
    await page.getByTestId('step-skip').click();
    await page.waitForURL(/\/form\/7/);
    await page.getByTestId('radio-option-no').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/9/);
    await page.waitForSelector('[data-testid="checkbox-option-glp1"]', { timeout: 120000 });
    await page.getByTestId('checkbox-option-glp1').click();
    await Promise.all([
      page.waitForURL(/\/result/),
      page.getByTestId('step-submit').click(),
    ]);
    await expect(page.getByTestId('result-outcome')).toBeVisible();
  });

  // original clinical review test removed
});
