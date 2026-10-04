import type { KeyValueStore } from '../ports';
import { DEFAULT_PREFERENCES, type Preferences } from '../../model/session';
import { BUILTIN_PRESETS } from '../../data/presets';
import { sanitizeRecipe, type Recipe } from '../../model/recipe';
import { decodeRecipe, parseRecipeFile, recipesEqual, SHARE_HASH } from '../../core/recipeCodec';
import { loadPresets } from './PresetService';
import { RECIPE_KEY } from './AutosaveService';

export const PREFERENCES_KEY = 'autotile_blob47.preferences.v1';
export function bootStudio(store: KeyValueStore, hash: string) {
  let recipe = sanitizeRecipe(BUILTIN_PRESETS[0].recipe);
  let preferences: Preferences = { ...DEFAULT_PREFERENCES };
  let presets: ReturnType<typeof loadPresets> = [];
  let pendingRecipe: Recipe | null = null;
  let selectedPresetId = BUILTIN_PRESETS[0].id;
  const errors: string[] = [];
  const attempt = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  };
  attempt(() => {
    const raw = store.getItem(PREFERENCES_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.format !== 'autotile-blob47-preferences' || saved.version !== 1)
      throw new Error('无效界面设置 / Invalid preferences');
    const p = saved.preferences;
    preferences = {
      lang: p?.lang === 'en' ? 'en' : 'zh',
      showGrid: typeof p?.showGrid === 'boolean' ? p.showGrid : true,
      showCellDots: typeof p?.showCellDots === 'boolean' ? p.showCellDots : true,
      zoom: [1, 2, 4, 8].includes(p?.zoom) ? p.zoom : 2,
      playgroundZoom: [1, 2, 4, 8].includes(p?.playgroundZoom) ? p.playgroundZoom : 1,
    };
  });
  attempt(() => {
    presets = loadPresets(store);
  });
  let shared = false;
  if (hash.startsWith(SHARE_HASH))
    attempt(() => {
      recipe = decodeRecipe(hash.slice(SHARE_HASH.length));
      selectedPresetId = 'custom';
      shared = true;
    });
  if (!shared)
    attempt(() => {
      const raw = store.getItem(RECIPE_KEY);
      if (!raw) return;
      const saved = parseRecipeFile(raw);
      if (!recipesEqual(saved, recipe)) pendingRecipe = saved;
    });
  return {
    recipe,
    preferences,
    presets,
    pendingRecipe,
    selectedPresetId,
    error: errors.join(' · ') || null,
  };
}
export type StudioBoot = ReturnType<typeof bootStudio>;
