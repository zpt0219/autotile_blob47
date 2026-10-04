import {
  BLOB47_BACKGROUND,
  BLOB47_COLS,
  blobSlotForMask,
  N,
  E,
  S,
  W,
  NE,
  SE,
  SW,
  NW,
} from './blob47';
import { recipeToPaintArgs, renderSheetRGBA, SHEET_TILE_SIZE, SHEET_WIDTH } from './renderSheet';
import { paintPatternTileRGBA } from './patterns/patternPaint';
import type { Recipe } from '../model/recipe';

export interface RenderedTileset {
  sheet: Uint8ClampedArray<ArrayBuffer>;
  background: Uint8ClampedArray<ArrayBuffer>;
}
export function renderTileset(recipe: Recipe): RenderedTileset {
  const a = recipeToPaintArgs(recipe);
  return {
    sheet: renderSheetRGBA(recipe),
    background: paintPatternTileRGBA(a.patternId, BLOB47_BACKGROUND, a.roleColours, a.opts),
  };
}
export function renderMapRGBA(
  cells: readonly (readonly number[])[],
  tiles: RenderedTileset,
): Uint8ClampedArray<ArrayBuffer> {
  const rows = cells.length,
    cols = cells[0]?.length ?? 0,
    ts = SHEET_TILE_SIZE;
  const at = (x: number, y: number) => cells[y]?.[x] ?? 0;
  const out = new Uint8ClampedArray(new ArrayBuffer(rows * cols * ts * ts * 4));
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const mask =
        (at(x, y - 1) ? N : 0) |
        (at(x + 1, y) ? E : 0) |
        (at(x, y + 1) ? S : 0) |
        (at(x - 1, y) ? W : 0) |
        (at(x + 1, y - 1) ? NE : 0) |
        (at(x + 1, y + 1) ? SE : 0) |
        (at(x - 1, y + 1) ? SW : 0) |
        (at(x - 1, y - 1) ? NW : 0);
      const slot = blobSlotForMask(mask),
        background = !at(x, y);
      const sx = (slot % BLOB47_COLS) * ts,
        sy = Math.floor(slot / BLOB47_COLS) * ts;
      for (let row = 0; row < ts; row++) {
        const from = background ? row * ts * 4 : ((sy + row) * SHEET_WIDTH + sx) * 4;
        const data = background ? tiles.background : tiles.sheet;
        out.set(data.subarray(from, from + ts * 4), ((y * ts + row) * cols * ts + x * ts) * 4);
      }
    }
  return out;
}
