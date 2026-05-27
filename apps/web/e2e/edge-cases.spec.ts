import { test, expect } from '@playwright/test';

test.describe('Edge cases', () => {
  test('BP hypertensive_crisis → Clinical Review (highest severity wins)', async ({ page }) => { test.setTimeout(120000);
    await page.goto('/');
    await page.waitForURL(/\/form\/1/);

    await page.getByTestId('number-input-age').fill('40');
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/2/);

    await page.getByTestId('number-input-weight').fill('90');
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

    // Select both Normal AND Hypertensive Crisis → highest severity wins
    await page.getByTestId('checkbox-option-normal').click();
    await page.getByTestId('checkbox-option-hypertensive_crisis').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/10/);

    // Skip medications
    await page.getByTestId('step-skip').click();
    await page.waitForURL(/\/form\/11/);

    await page.getByTestId('radio-option-no').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/12/, { timeout: 120000 });

    await page.getByTestId('radio-option-monthly').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/13/, { timeout: 120000 });

    await page.getByTestId('radio-option-moderate').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/14/, { timeout: 120000 });

    await page.waitForSelector('[data-testid="step-skip"]', { state: 'visible', timeout: 120000 });
    await page.getByTestId('step-skip').click();
    await page.waitForURL(/\/result/);

    // Hypertensive crisis should trigger clinical review
    await expect(page.getByTestId('result-outcome')).toContainText('Clinical review');
  });
});
