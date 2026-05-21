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

  test('already on GLP-1 → Clinical Review', async ({ page }) => {
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

    await page.getByTestId('step-skip').click();
    await page.waitForURL(/\/form\/7/);

    await page.getByTestId('radio-option-no').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/form\/9/);

    await page.getByTestId('step-skip').click();
    await page.waitForURL(/\/form\/10/);

    // Select GLP-1
    await page.getByTestId('checkbox-option-glp1').click();
    await page.getByTestId('step-submit').click();
    await page.waitForURL(/\/result/);

    await expect(page.getByTestId('result-outcome')).toContainText('Clinical review');
    await expect(page.getByTestId('result-reason')).toContainText('Already On Therapy');
  });
});
