import type { Recipe } from './recipe';

export interface PresetItem {
  id: string;
  name: string;
  recipe: Recipe;
  savedAt?: string;
  isBuiltin?: boolean;
}
