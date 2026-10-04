import type { KeyValueStore } from '../ports';
import { recipeFile } from '../../core/recipeCodec';
import { sanitizeRecipe, type Recipe } from '../../model/recipe';

export const RECIPE_KEY = 'autotile_blob47.recipe.v1';
export type SaveResult = { success: true } | { success: false; error: string };
export function failure(error: unknown): SaveResult {
  return { success: false, error: error instanceof Error ? error.message : String(error) };
}
export class AutosaveService {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly store: KeyValueStore;
  constructor(store: KeyValueStore) {
    this.store = store;
  }
  private pending: Recipe | null = null;
  private done: ((result: SaveResult) => void) | null = null;
  schedule(recipe: Recipe, done: (result: SaveResult) => void, delay = 300): void {
    this.cancel();
    this.pending = sanitizeRecipe(recipe);
    this.done = done;
    this.timer = setTimeout(() => this.flush(), delay);
  }
  flush(): SaveResult | null {
    if (!this.pending) return null;
    const snapshot = this.pending,
      done = this.done;
    this.cancel();
    let result: SaveResult;
    try {
      this.store.setItem(RECIPE_KEY, JSON.stringify(recipeFile(snapshot)));
      result = { success: true };
    } catch (error) {
      result = failure(error);
    }
    done?.(result);
    return result;
  }
  cancel(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.pending = null;
    this.done = null;
  }
}
