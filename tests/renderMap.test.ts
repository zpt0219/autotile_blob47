import { it, expect } from 'vitest';
import { renderMapRGBA, renderTileset } from '../src/core/renderMap';
import { DEFAULT_RECIPE, sanitizeRecipe } from '../src/model/recipe';
import { paintPatternTileRGBA } from '../src/core/patterns/patternPaint';
import { recipeToPaintArgs } from '../src/core/renderSheet';

it('renders an isolated tile with mask 0 and keeps transparent background empty', () => {
  const recipe = sanitizeRecipe({ ...DEFAULT_RECIPE, transparentB: true }),
    tiles = renderTileset(recipe);
  const map = renderMapRGBA(
    [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    tiles,
  );
  const a = recipeToPaintArgs(recipe),
    tile = paintPatternTileRGBA(a.patternId, 0, a.roleColours, a.opts);
  for (let y = 0; y < 32; y++)
    expect(map.slice(((32 + y) * 96 + 32) * 4, ((32 + y) * 96 + 64) * 4)).toEqual(
      tile.slice(y * 32 * 4, (y + 1) * 32 * 4),
    );
  expect(map.slice(0, 96 * 32 * 4).every((v, i) => i % 4 !== 3 || v === 0)).toBe(true);
});
