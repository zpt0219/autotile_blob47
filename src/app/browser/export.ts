import { zipSync, strToU8 } from 'fflate';
import type { ExportBackend } from '../ports';
import { recipeFile } from '../../core/recipeCodec';
import { buildSheetExportData } from '../../core/exportMetadata';
import { SHEET_WIDTH, SHEET_HEIGHT } from '../../core/renderSheet';

export function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  try {
    document.body.appendChild(a);
    a.click();
  } finally {
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
export const browserExports: ExportBackend = {
  downloadRecipe(recipe) {
    downloadBlob(
      `blob47_${recipe.patternId}.recipe.json`,
      new Blob([JSON.stringify(recipeFile(recipe), null, 2)], { type: 'application/json' }),
    );
  },
  async downloadTileset(recipe, rgba) {
    const canvas = document.createElement('canvas');
    canvas.width = SHEET_WIDTH;
    canvas.height = SHEET_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.putImageData(new ImageData(rgba, SHEET_WIDTH, SHEET_HEIGHT), 0, 0);
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png'),
    );
    const meta = buildSheetExportData(recipe);
    const files = {
      [meta.sheet.file]: new Uint8Array(await png.arrayBuffer()),
      [meta.sheet.file.replace(/\.png$/, '.json')]: strToU8(JSON.stringify(meta, null, 2)),
    };
    const zip = new Uint8Array(zipSync(files));
    downloadBlob(
      `blob47_${recipe.patternId}_32px.zip`,
      new Blob([zip], { type: 'application/zip' }),
    );
  },
};
