import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { DEFAULT_RECIPE, sanitizeRecipe, type Recipe } from '../src/model/recipe';
import { renderSheetRGBA, type PaintOverrides } from '../src/core/renderSheet';

const cases = JSON.parse(
  readFileSync(new URL('./fixtures/baseline.json', import.meta.url), 'utf8'),
) as {
  name: string;
  patch: Partial<Recipe>;
  overrides?: PaintOverrides;
}[];
describe('extracted renderer pixel parity', () => {
  for (const sample of cases)
    it(sample.name, () => {
      const overrides = sample.overrides;
      const recipe = sanitizeRecipe({
        ...DEFAULT_RECIPE,
        ...sample.patch,
        noiseTargets: overrides?.noiseTargets ?? DEFAULT_RECIPE.noiseTargets,
        customNoiseHex: overrides?.noiseColours?.edge ? { edge: '#ff0000' } : null,
      });
      const expected = gunzipSync(
        readFileSync(new URL(`./fixtures/${sample.name}.rgba.gz`, import.meta.url)),
      );
      expect(Buffer.from(renderSheetRGBA(recipe)).equals(expected)).toBe(true);
    });
});
