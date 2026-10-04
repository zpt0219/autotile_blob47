import { describe, it, expect } from 'vitest';
import { DEFAULT_RECIPE, sanitizeRecipe } from '../src/model/recipe';
import { decodeRecipe, encodeRecipe, parseRecipeFile, recipeFile } from '../src/core/recipeCodec';
import { renderSheetRGBA } from '../src/core/renderSheet';

describe('new recipe format', () => {
  it('round trips all render settings, including sparse water colours and grain targets', () => {
    const recipe = sanitizeRecipe({
      ...DEFAULT_RECIPE,
      outlineWidth: 5.5,
      ribbonAlgo: 'dashes',
      ribbonPeriod: 16,
      patternNoise: ['blue'],
      noiseTargets: ['edge'],
      customNoiseHex: { edge: '#123456', a: '#abcdef' },
      textureAlgoA: 'water',
      textureShadesA: 4,
      customTexHex: { terrainA: [undefined, '#fedcba', undefined], terrainB: null },
    });
    const decoded = decodeRecipe(encodeRecipe(recipe));
    expect(decoded).toEqual(recipe);
    expect(parseRecipeFile(JSON.stringify(recipeFile(recipe)))).toEqual(recipe);
    expect(Buffer.from(renderSheetRGBA(decoded)).equals(Buffer.from(renderSheetRGBA(recipe)))).toBe(
      true,
    );
  });
  it('rejects legacy wrappers and raw recipe objects', () => {
    expect(() => parseRecipeFile(JSON.stringify({ v: 1, recipe: DEFAULT_RECIPE }))).toThrow();
    expect(() => parseRecipeFile(JSON.stringify(DEFAULT_RECIPE))).toThrow();
    expect(() => decodeRecipe('AQABC')).toThrow();
  });
  it('rejects unknown versions and invalid values instead of replacing the document', () => {
    expect(() =>
      parseRecipeFile(JSON.stringify({ ...recipeFile(DEFAULT_RECIPE), version: 2 })),
    ).toThrow();
    expect(() =>
      parseRecipeFile(JSON.stringify(recipeFile(DEFAULT_RECIPE)).replace('rounded', 'missing')),
    ).toThrow();
    expect(() =>
      parseRecipeFile(JSON.stringify({ format: 'autotile-blob47-recipe', version: 1, recipe: {} })),
    ).toThrow();
    expect(() => decodeRecipe('b1.!!!')).toThrow();
    expect(() => decodeRecipe('b1.a')).toThrow();
  });
});
