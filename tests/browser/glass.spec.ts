import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';

test('source refraction changes scene pixels, preserves DOM, and toggles off', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('SVG source');
  await page.getByRole('button', { name: 'Follow pointer' }).click();
  await page.mouse.move(0, 0);
  // A highlight alone must never count as working refraction.
  await page.getByText('Shape size & surface depth', { exact: true }).click();
  await page.locator('#highlight').fill('0');
  await page.locator('#blur').fill('0');
  await page.locator('#strength').fill('40');
  await expect(page.locator('#highlight-value')).toHaveText('0');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const scene = page.locator('#source');
  const bent = PNG.sync.read(await scene.screenshot());
  await page.getByRole('button', { name: 'Refraction on', exact: true }).click();
  await expect(page.locator('#status')).toHaveText('disabled');
  const flat = PNG.sync.read(await scene.screenshot());
  expect(bent.width).toBe(flat.width); expect(bent.height).toBe(flat.height);
  let changed = 0;
  for (let i = 0; i < bent.data.length; i += 4) {
    if (Math.abs(bent.data[i] - flat.data[i]) + Math.abs(bent.data[i+1] - flat.data[i+1]) + Math.abs(bent.data[i+2] - flat.data[i+2]) > 35) changed++;
  }
  expect(changed).toBeGreaterThan(300);
  await expect(scene.locator('.word')).toHaveText('See through.');
  await page.getByRole('button', { name: 'Refraction off', exact: true }).click();
  await expect(page.locator('#status')).toHaveText('SVG source');
});

test('lifecycle and ownership checks', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Compatibility, limitations & interactive checks', { exact: true }).click();
  await page.getByRole('button', { name: 'Run browser checks' }).click();
  await expect(page.locator('#test-results')).toHaveAttribute('data-result', 'passed', { timeout: 30000 });
});

test('keyboard selection uses live controls', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Overview', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Details', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Details', exact: true })).toBeFocused();
});

test('shape and material presets drive the live lens and component controls', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Component preset', exact: true }).selectOption('button');
  await expect(page.locator('#map-size')).toHaveText('160 × 160');
  await expect(page.getByRole('combobox', { name: 'Surface', exact: true })).toHaveValue('dome');
  await page.getByRole('combobox', { name: 'Component preset', exact: true }).selectOption('panel');
  await expect(page.locator('#map-size')).toHaveText('236 × 140');
  await expect(page.getByRole('combobox', { name: 'Frost distribution', exact: true })).toHaveValue('center');
  await page.getByRole('button', { name: 'Press glass button', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Press glass button', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('switch', { name: 'Glass switch', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Glass switch', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('slider', { name: 'Glass slider', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#slider-value')).toHaveText('51');
});
