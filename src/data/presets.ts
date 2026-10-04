import { DEFAULT_RECIPE, sanitizeRecipe } from '../model/recipe';
import type { PresetItem } from '../model/preset';

export const BUILTIN_PRESETS: readonly PresetItem[] = [
  {
    id: 'waterfront',
    name: '水岸 / Waterfront',
    isBuiltin: true,
    recipe: sanitizeRecipe(DEFAULT_RECIPE),
  },
];
