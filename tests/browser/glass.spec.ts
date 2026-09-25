import { test, expect, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

async function expectAlignedRefraction(page: Page) {
  const stage = page.locator('#stage');
  await stage.scrollIntoViewIfNeeded();
  await expect(page.locator('#status')).toHaveText('SVG source');
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const lens = await page.locator('#lens').evaluate(element => {
    const style = (element as HTMLElement).style;
    return { x: parseFloat(style.left), y: parseFloat(style.top), width: parseFloat(style.width), height: parseFloat(style.height) };
  });
  const bent = PNG.sync.read(await stage.screenshot({ scale: 'css' }));
  // Dispatch the real control's event without scrolling a mobile scene offscreen.
  await page.locator('#effect').dispatchEvent('click');
  await expect(page.locator('#status')).toHaveText('disabled');
  const flat = PNG.sync.read(await stage.screenshot({ scale: 'css' }));
  expect([bent.width, bent.height]).toEqual([flat.width, flat.height]);
  let inside = 0, outside = 0;
  const difference = (a: number, b: number) => [0, 1, 2].reduce((sum, channel) =>
    sum + Math.abs(bent.data[a + channel] - flat.data[b + channel]), 0);
  for (let y = 2; y < bent.height - 2; y++) for (let x = 2; x < bent.width - 2; x++) {
    const i = (y * bent.width + x) * 4;
    if (difference(i, i) <= 35) continue;
    if (x >= lens.x - 2 && x <= lens.x + lens.width + 2 && y >= lens.y - 2 && y <= lens.y + lens.height + 2) {
      inside++;
    } else {
      // A filter can change text/grid antialiasing at fractional DPR positions.
      // Allow a one-pixel rasterization tolerance, never a shifted/clipped scene.
      let nearest = Infinity;
      const low = [255, 255, 255], high = [0, 0, 0];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const j = ((y + dy) * flat.width + x + dx) * 4;
        nearest = Math.min(nearest, difference(i, j));
        for (let c = 0; c < 3; c++) { low[c] = Math.min(low[c], flat.data[j + c]); high[c] = Math.max(high[c], flat.data[j + c]); }
      }
      // Fractional-DPR antialiasing can interpolate between neighboring colors
      // rather than match one discrete pixel, particularly in Gecko on Linux.
      const outsideLocalColors = [0, 1, 2].some(c => bent.data[i + c] < low[c] - 8 || bent.data[i + c] > high[c] + 8);
      if (nearest > 35 && outsideLocalColors) outside++;
    }
  }
  expect(inside, 'the lens must actually refract source pixels').toBeGreaterThan(100);
  // Permit sparse antialiasing differences (under 0.5% of the scene). The
  // Safari regression clips most of the scene; an offset lens also exceeds this.
  expect(outside, 'pixels outside the lens must retain the source').toBeLessThan(bent.width * bent.height * 0.005);
  await page.locator('#effect').dispatchEvent('click');
  await expect(page.locator('#status')).toHaveText('SVG source');
}

test('desktop refraction remains inside the lens across frost pipelines', async ({ page }) => {
  await page.goto('/optics.html');
  await page.locator('#pin').dispatchEvent('click');
  await expectAlignedRefraction(page);
  for (const preset of ['panel', 'button', 'custom']) {
    await page.getByRole('combobox', { name: 'Component preset', exact: true }).selectOption(preset);
    await expectAlignedRefraction(page);
  }
  await page.locator('#blur').evaluate(element => {
    (element as HTMLInputElement).value = '3';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expectAlignedRefraction(page);
});

test.describe('mobile Safari layout regression', () => {
  test.use({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 3 });
  test('refraction follows the box after movement, scrolling, and resizing', async ({ page }) => {
    await page.goto('/optics.html');
    await page.locator('#pin').dispatchEvent('click');
    await expectAlignedRefraction(page);
    const builds = await page.locator('#builds').textContent();
    await page.locator('#x').evaluate(element => {
      (element as HTMLInputElement).value = '15';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.locator('#y').evaluate(element => {
      (element as HTMLInputElement).value = '80';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.evaluate(() => window.scrollTo(0, 150));
    await expectAlignedRefraction(page);
    await expect(page.locator('#builds')).toHaveText(builds!);
    await page.setViewportSize({ width: 390, height: 844 });
    await expectAlignedRefraction(page);
    await page.getByRole('combobox', { name: 'Component preset', exact: true }).selectOption('button');
    await expectAlignedRefraction(page);
  });
});

test('source refraction changes scene pixels, preserves DOM, and toggles off', async ({ page }) => {
  await page.goto('/optics.html');
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
  await page.goto('/optics.html');
  await page.getByText('Compatibility, limitations & interactive checks', { exact: true }).click();
  await page.getByRole('button', { name: 'Run browser checks' }).click();
  await expect(page.locator('#test-results')).toHaveAttribute('data-result', 'passed', { timeout: 30000 });
});

test('keyboard selection uses live controls', async ({ page }) => {
  await page.goto('/optics.html');
  await page.getByRole('tab', { name: 'Overview', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Details', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Details', exact: true })).toBeFocused();
});

test('shape and material presets drive the live lens and component controls', async ({ page }) => {
  await page.goto('/optics.html');
  await page.getByRole('combobox', { name: 'Component preset', exact: true }).selectOption('button');
  await expect(page.locator('#map-size')).toHaveText('160 × 160');
  await expect(page.getByRole('combobox', { name: 'Surface', exact: true })).toHaveValue('rim');
  await page.getByRole('combobox', { name: 'Component preset', exact: true }).selectOption('panel');
  await expect(page.locator('#map-size')).toHaveText('236 × 140');
  await expect(page.getByRole('combobox', { name: 'Frost distribution', exact: true })).toHaveValue('uniform');
  await page.getByRole('button', { name: 'Press glass button', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Press glass button', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('switch', { name: 'Glass switch', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Glass switch', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('slider', { name: 'Glass slider', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#slider-value')).toHaveText('51');
});
