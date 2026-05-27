import { test, expect } from '@playwright/test';

test.describe('Happy path — eligible user', () => {
  test('completes all screens and reaches Eligible result', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/form\/1/);

    // S1: Age 45
    await page.getByTestId('number-input-age').fill('45');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/2/);

    // S2: Weight 90kg
    await page.getByTestId('number-input-weight').fill('90');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/3/);

    // S3: Height 170cm → BMI ~31.1 (triggers S5 next)
    await page.getByTestId('number-input-height').fill('170');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/5/);

    // S5: Not pregnant
    await page.getByTestId('radio-option-no').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/6/);

    // S6: Comorbidities — select 1 (hypertension)
    await page.getByTestId('checkbox-option-hypertension').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/7/);

    // S7: No diabetes
    await page.getByTestId('radio-option-no').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/9/);

    // S9: Normal BP
    await page.getByTestId('checkbox-option-normal').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/10/);

    // S10: No GLP-1 — skip
    await page.waitForSelector('[data-testid="step-skip"]', { state: 'visible', timeout: 120000 });
await page.getByTestId('step-skip').click();
    await page.waitForURL(/\/form\/11/);

    // S11: No smoking
    await page.getByTestId('radio-option-no').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/12/);

    // S12: Monthly alcohol
    await page.getByTestId('radio-option-monthly').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/13/);

    // S13: Moderate activity
    await page.getByTestId('radio-option-moderate').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/14/);

    // S14: Balanced diet — skip
    await page.getByTestId('step-skip').click();
    await page.waitForURL(/\/result/);

    // Verify result
    await expect(page.getByTestId('result-outcome')).toContainText('eligible');
  });
});
