import type { KeyValueStore } from '../ports';
import { validateRecipe } from '../../core/recipeCodec';
import type { PresetItem } from '../../model/preset';
import { failure, type SaveResult } from './AutosaveService';

export const PRESETS_KEY = 'autotile_blob47.presets.v1';
export function loadPresets(store: KeyValueStore): PresetItem[] {
  const raw = store.getItem(PRESETS_KEY);
  if (!raw) return [];
  const file = JSON.parse(raw);
  if (file.format !== 'autotile-blob47-presets' || file.version !== 1 || !Array.isArray(file.items))
    throw new Error('无效预设库 / Invalid preset library');
  const ids = new Set<string>();
  return file.items.map((item: PresetItem) => {
    if (
      !item ||
      typeof item.id !== 'string' ||
      !item.id.startsWith('user_') ||
      ids.has(item.id) ||
      typeof item.name !== 'string' ||
      !item.name.trim()
    )
      throw new Error('无效预设 / Invalid preset');
    ids.add(item.id);
    return {
      id: item.id,
      name: item.name.trim(),
      recipe: validateRecipe(item.recipe),
      savedAt: typeof item.savedAt === 'string' ? item.savedAt : undefined,
    };
  });
}
export function savePresets(store: KeyValueStore, items: readonly PresetItem[]): SaveResult {
  try {
    store.setItem(
      PRESETS_KEY,
      JSON.stringify({ format: 'autotile-blob47-presets', version: 1, items }),
    );
    return { success: true };
  } catch (error) {
    return failure(error);
  }
}
