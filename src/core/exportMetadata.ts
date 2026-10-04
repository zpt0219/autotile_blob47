import { BLOB47_LAYOUT, BLOB47_COLS, BLOB47_ROWS, blobSlotForMask } from './blob47';
import { SHEET_TILE_SIZE } from './renderSheet';
import { type Recipe } from '../model/recipe';

export interface SheetExportData {
  app: string;
  version: number;
  format: string;
  sheet: {
    file: string;
    tileSize: number;
    columns: number;
    rows: number;
    slots: number;
  };
  bits: {
    N: number;
    E: number;
    S: number;
    W: number;
    NE: number;
    SE: number;
    SW: number;
    NW: number;
  };
  layout: number[];
  maskToSlot: number[];
  recipe: Recipe;
}

export function buildSheetExportData(recipe: Recipe): SheetExportData {
  const maskToSlot: number[] = new Array(256);
  for (let mask = 0; mask < 256; mask++) {
    maskToSlot[mask] = blobSlotForMask(mask);
  }

  const fileName = `tileset_blob47_${recipe.patternId}_${SHEET_TILE_SIZE}px.png`;

  return {
    app: 'autotile_blob47',
    format: 'autotile-blob47-tileset',
    version: 1,
    sheet: {
      file: fileName,
      // Stays in the sidecar even though it is now a constant: this half of the
      // file is the engine's import contract, and an importer should not have to
      // know that this generator only ever emits 32.
      tileSize: SHEET_TILE_SIZE,
      columns: BLOB47_COLS,
      rows: BLOB47_ROWS,
      slots: BLOB47_LAYOUT.length,
    },
    bits: {
      N: 1,
      E: 2,
      S: 4,
      W: 8,
      NE: 16,
      SE: 32,
      SW: 64,
      NW: 128,
    },
    layout: Array.from(BLOB47_LAYOUT),
    maskToSlot,
    recipe,
  };
}
