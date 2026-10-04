import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { TRANSLATIONS } from '../src/shared/i18n';
import { DEFAULT_RECIPE, sanitizeRecipe, type Recipe } from '../src/model/recipe';
import { recipeFile, decodeRecipe, SHARE_HASH } from '../src/core/recipeCodec';
import { renderSheetRGBA } from '../src/core/renderSheet';
import { RECIPE_KEY } from '../src/app/services/AutosaveService';

const t = TRANSLATIONS.zh;
test.use({ hasTouch: true });
const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Autotile Blob47', exact: true })).toBeVisible();
  await expect(page.locator('.tileset-canvas')).toHaveJSProperty('width', 256);
});
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});
async function pixels(page: Page, selector = '.tileset-canvas') {
  return page.locator(selector).evaluate((canvas: HTMLCanvasElement) => {
    const bytes = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261;
    for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
    return hash;
  });
}
async function importRecipe(page: Page, recipe: Recipe) {
  await page.getByLabel('Import recipe file').setInputFiles({
    name: 'test.recipe.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(recipeFile(recipe))),
  });
  await expect(page.getByRole('alert')).toContainText(t.recipeImported);
}
async function exportedRecipe(page: Page) {
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: t.exportRecipe, exact: true }).click();
  const download = await event;
  return JSON.parse(await readFile((await download.path())!, 'utf8'));
}
test('panels, language and texture picker work', async ({ page }) => {
  await page.locator('select').nth(1).selectOption('moss');
  await page.getByRole('button', { name: t.langBtn, exact: true }).click();
  await expect(
    page.getByRole('heading', { name: TRANSLATIONS.en.sectionBand, exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: TRANSLATIONS.en.langBtn, exact: true }).click();
  await page.locator('.texture-picker-trigger').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/studio-desktop.png', fullPage: true });
});
test('new recipe round trip and failed import leave editing intact', async ({ page }) => {
  const recipe = sanitizeRecipe({
    ...DEFAULT_RECIPE,
    patternId: 'moss',
    outlineWidth: 5.5,
    noiseTargets: ['edge'],
    patternNoise: ['blue'],
    customNoiseHex: { edge: '#ff0000' },
    textureAlgoA: 'water',
    textureShadesA: 4,
    customTexHex: { terrainA: [undefined, '#00aaff', '#ffffff'], terrainB: null },
  });
  await importRecipe(page, recipe);
  expect((await exportedRecipe(page)).recipe).toEqual(JSON.parse(JSON.stringify(recipe)));
  await page.getByLabel('Import recipe file').setInputFiles({
    name: 'old.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ v: 1, recipe: DEFAULT_RECIPE })),
  });
  await expect(page.getByRole('alert')).toContainText(t.recipeImportFailed);
  expect((await exportedRecipe(page)).recipe).toEqual(JSON.parse(JSON.stringify(recipe)));
});
test('new sharing has priority over saved data', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const recipe = sanitizeRecipe({
    ...DEFAULT_RECIPE,
    edgeSeed: 481,
    patternNoise: ['white'],
    noiseTargets: ['terrainA'],
    customNoiseHex: { a: '#123456' },
  });
  await importRecipe(page, recipe);
  await page.getByRole('button', { name: t.presetCopyLink, exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(t.presetLinkCopied);
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(decodeRecipe(new URL(link).hash.slice(SHARE_HASH.length))).toEqual(recipe);
  await page.goto(link);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await exportedRecipe(page)).recipe).toEqual(JSON.parse(JSON.stringify(recipe)));
});
test('restore waits without overwriting the saved recipe', async ({ page }) => {
  await importRecipe(page, sanitizeRecipe({ ...DEFAULT_RECIPE, edgeSeed: 666 }));
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(650);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).recipe.edgeSeed,
      RECIPE_KEY,
    ),
  ).toBe(666);
  await page.getByRole('button', { name: t.restoreBtn, exact: true }).click();
  expect((await exportedRecipe(page)).recipe.edgeSeed).toBe(666);
  await page.reload();
  await page.getByRole('button', { name: t.startFreshBtn, exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).recipe.edgeSeed, RECIPE_KEY),
    )
    .toBe(0);
});
test('old storage is ignored and autosave failures are visible', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('adna_blob47_recipe', JSON.stringify({ v: 1, recipe: { edgeSeed: 88 } }));
  });
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await exportedRecipe(page)).recipe.edgeSeed).toBe(0);
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota exhausted', 'QuotaExceededError');
    };
  });
  await page.reload();
  await expect(page.getByRole('status')).toContainText('自动保存失败');
  expect((await exportedRecipe(page)).format).toBe('autotile-blob47-recipe');
});
test('presets persist, rename and delete', async ({ page }) => {
  await importRecipe(
    page,
    sanitizeRecipe({ ...DEFAULT_RECIPE, patternId: 'jagged', edgeSeed: 25 }),
  );
  page.once('dialog', (d) => d.accept('测试预设'));
  await page.getByRole('button', { name: t.presetSaveAs, exact: true }).click();
  await expect(page.locator('select').first()).toContainText('测试预设');
  page.once('dialog', (d) => d.accept('重命名预设'));
  await page.getByRole('button', { name: t.presetRename, exact: true }).click();
  await expect(page.locator('select').first()).toContainText('重命名预设');
  await page.reload();
  await page.getByRole('button', { name: t.restoreBtn, exact: true }).click();
  await page.locator('select').first().selectOption({ label: '重命名预设' });
  expect((await exportedRecipe(page)).recipe.edgeSeed).toBe(25);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: t.presetDelete, exact: true }).click();
  await expect(page.locator('select').first().locator('option')).toHaveCount(1);
});
test('mouse and touch strokes are continuous and erasable', async ({ page, context }) => {
  const canvas = page.getByLabel('Blob47 playground');
  await canvas.scrollIntoViewIfNeeded();
  const bounds = (await canvas.boundingBox())!;
  const before = await pixels(page, '.playground-canvas');
  await page.mouse.move(bounds.x + 16, bounds.y + 16);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 300, bounds.y + 16, { steps: 2 });
  await page.mouse.up();
  await expect.poll(() => pixels(page, '.playground-canvas')).not.toBe(before);
  const painted = await pixels(page, '.playground-canvas');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: bounds.x + 16, y: bounds.y + 80 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: bounds.x + 300, y: bounds.y + 80 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => pixels(page, '.playground-canvas')).not.toBe(painted);
  await page.getByRole('button', { name: t.clearPlayground, exact: true }).click();
  await expect.poll(() => pixels(page, '.playground-canvas')).toBe(before);
  await page.getByRole('button', { name: t.fillPlaygroundA, exact: true }).click();
  await expect.poll(() => pixels(page, '.playground-canvas')).not.toBe(before);
  await page.getByRole('button', { name: t.eraseTool, exact: true }).click();
  const filled = await pixels(page, '.playground-canvas');
  await canvas.scrollIntoViewIfNeeded();
  const eraseBounds = (await canvas.boundingBox())!;
  await page.touchscreen.tap(eraseBounds.x + 160, eraseBounds.y + 160);
  await expect.poll(() => pixels(page, '.playground-canvas')).not.toBe(filled);
});
test('ZIP PNG and metadata share an immutable export snapshot', async ({ page }) => {
  await importRecipe(
    page,
    sanitizeRecipe({
      ...DEFAULT_RECIPE,
      patternNoise: ['white'],
      noiseTargets: ['edge'],
      customNoiseHex: { edge: '#ff0000' },
      transparentB: true,
    }),
  );
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      original.call(this, (b) => setTimeout(() => callback(b), 300), type, quality);
    };
  });
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: '💾 ' + t.downloadBundle, exact: true }).click();
  await page.locator('select').nth(1).selectOption('moss');
  const download = await event;
  const files = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  const jsonName = Object.keys(files).find((n) => n.endsWith('.json'))!,
    pngName = Object.keys(files).find((n) => n.endsWith('.png'))!;
  const meta = JSON.parse(strFromU8(files[jsonName]));
  expect(meta.recipe.patternId).toBe('rounded');
  expect(meta.recipe.customNoiseHex.edge).toBe('#ff0000');
  const actual = await page.evaluate(async (bytes) => {
    const image = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/png' }));
    const c = document.createElement('canvas');
    c.width = image.width;
    c.height = image.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    image.close();
    return Array.from(ctx.getImageData(0, 0, c.width, c.height).data);
  }, Array.from(files[pngName]));
  const expected = renderSheetRGBA(meta.recipe);
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++)
    if ((i % 4 === 3 || expected[i - (i % 4) + 3]) && expected[i] !== actual[i]) mismatch++;
  expect(mismatch).toBe(0);
});
test('narrow viewport keeps controls usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Autotile Blob47', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/studio-mobile.png', fullPage: true });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
});

test('a delayed file import cannot replace edits made while it loads', async ({ page }) => {
  await page.evaluate(() => {
    const original = File.prototype.text;
    File.prototype.text = function () {
      const delay = this.name === 'slow.json' ? 500 : 0;
      return original
        .call(this)
        .then((text) => new Promise<string>((resolve) => setTimeout(() => resolve(text), delay)));
    };
  });
  const file = recipeFile(sanitizeRecipe({ ...DEFAULT_RECIPE, patternId: 'square' }));
  await page.getByLabel('Import recipe file').setInputFiles({
    name: 'slow.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(file)),
  });
  await page.locator('select').nth(1).selectOption('moss');
  await page.waitForTimeout(650);
  expect((await exportedRecipe(page)).recipe.patternId).toBe('moss');
});
