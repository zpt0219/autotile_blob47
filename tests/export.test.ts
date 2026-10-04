import { it, expect } from 'vitest';
import { ExportService } from '../src/app/services/ExportService';
import { DEFAULT_RECIPE, sanitizeRecipe, type Recipe } from '../src/model/recipe';
import { buildSheetExportData } from '../src/core/exportMetadata';
import { renderSheetRGBA } from '../src/core/renderSheet';

it('exports a stable complete snapshot while the source is edited', async () => {
  const source = sanitizeRecipe({
    ...DEFAULT_RECIPE,
    patternNoise: ['white'],
    customNoiseHex: { edge: '#ff0000' },
    noiseTargets: ['edge'],
  });
  let release = () => {};
  let captured: Recipe | undefined;
  let pixels: Uint8ClampedArray | undefined;
  const service = new ExportService({
    downloadRecipe: () => {},
    downloadTileset: async (recipe, rgba) => {
      captured = recipe;
      pixels = rgba;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    },
  });
  const pending = service.exportTileset(source);
  source.roleHex.edge = '#000000';
  source.noiseTargets.length = 0;
  expect(captured!.roleHex.edge).toBe(DEFAULT_RECIPE.roleHex.edge);
  const meta = buildSheetExportData(captured!);
  expect(meta.recipe.noiseTargets).toEqual(['edge']);
  expect(meta.sheet.columns).toBe(8);
  expect(meta.sheet.rows).toBe(6);
  expect(Buffer.from(pixels!).equals(Buffer.from(renderSheetRGBA(meta.recipe)))).toBe(true);
  release();
  await pending;
});
