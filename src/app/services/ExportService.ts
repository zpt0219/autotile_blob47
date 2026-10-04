import type { ExportBackend } from '../ports';
import { sanitizeRecipe, type Recipe } from '../../model/recipe';
import { renderSheetRGBA } from '../../core/renderSheet';

export class ExportService {
  private readonly backend: ExportBackend;
  constructor(backend: ExportBackend) {
    this.backend = backend;
  }
  exportRecipe(recipe: Recipe): void {
    this.backend.downloadRecipe(sanitizeRecipe(recipe));
  }
  async exportTileset(recipe: Recipe): Promise<void> {
    const snapshot = sanitizeRecipe(recipe);
    const rgba = renderSheetRGBA(snapshot);
    await this.backend.downloadTileset(snapshot, rgba);
  }
}
