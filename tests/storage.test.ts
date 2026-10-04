import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { AutosaveService, RECIPE_KEY } from '../src/app/services/AutosaveService';
import { bootStudio } from '../src/app/services/startup';
import { savePresets, loadPresets } from '../src/app/services/PresetService';
import { DEFAULT_RECIPE, sanitizeRecipe } from '../src/model/recipe';
import { recipeFile, encodeRecipe, SHARE_HASH } from '../src/core/recipeCodec';

function memory() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
  };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
describe('storage lifecycle', () => {
  it('debounces snapshots and cancel prevents writes', () => {
    const store = memory(),
      save = new AutosaveService(store),
      done = vi.fn();
    const first = sanitizeRecipe({ ...DEFAULT_RECIPE, edgeSeed: 1 });
    save.schedule(first, done);
    first.roleHex.edge = '#ffffff';
    vi.advanceTimersByTime(300);
    expect(JSON.parse(store.data.get(RECIPE_KEY)!).recipe.roleHex.edge).toBe(
      DEFAULT_RECIPE.roleHex.edge,
    );
    save.schedule(sanitizeRecipe({ ...DEFAULT_RECIPE, edgeSeed: 2 }), done);
    save.schedule(sanitizeRecipe({ ...DEFAULT_RECIPE, edgeSeed: 3 }), done);
    vi.advanceTimersByTime(300);
    expect(JSON.parse(store.data.get(RECIPE_KEY)!).recipe.edgeSeed).toBe(3);
    save.schedule(first, done);
    save.cancel();
    vi.advanceTimersByTime(300);
    expect(done).toHaveBeenCalledTimes(2);
  });
  it('flushes the last snapshot on departure without a duplicate timer write', () => {
    const store = memory(),
      save = new AutosaveService(store),
      done = vi.fn();
    save.schedule(sanitizeRecipe({ ...DEFAULT_RECIPE, edgeSeed: 45 }), done);
    expect(save.flush()).toEqual({ success: true });
    expect(JSON.parse(store.data.get(RECIPE_KEY)!).recipe.edgeSeed).toBe(45);
    vi.advanceTimersByTime(300);
    expect(done).toHaveBeenCalledTimes(1);
    expect(save.flush()).toBeNull();
  });
  it('reports unavailable storage and preset writes', () => {
    const store = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const done = vi.fn();
    new AutosaveService(store).schedule(DEFAULT_RECIPE, done);
    vi.advanceTimersByTime(300);
    expect(done).toHaveBeenCalledWith({ success: false, error: 'QuotaExceededError' });
    expect(savePresets(store, []).success).toBe(false);
  });
  it('restores only this project and gives a valid new share priority', () => {
    const store = memory(),
      saved = sanitizeRecipe({ ...DEFAULT_RECIPE, edgeSeed: 21 });
    store.data.set('adna_blob47_recipe', JSON.stringify({ v: 1, recipe: saved }));
    expect(bootStudio(store, '').pendingRecipe).toBeNull();
    store.data.set(RECIPE_KEY, JSON.stringify(recipeFile(saved)));
    const boot = bootStudio(store, '');
    expect(boot.pendingRecipe).toEqual(saved);
    expect(boot.recipe).toEqual(DEFAULT_RECIPE);
    const shared = sanitizeRecipe({ ...DEFAULT_RECIPE, edgeSeed: 87 });
    const fromUrl = bootStudio(store, SHARE_HASH + encodeRecipe(shared));
    expect(fromUrl.recipe).toEqual(shared);
    expect(fromUrl.pendingRecipe).toBeNull();
    expect(bootStudio(store, SHARE_HASH + 'invalid').error).toBeTruthy();
  });
  it('validates presets and preserves full recipe settings', () => {
    const store = memory();
    const recipe = sanitizeRecipe({
      ...DEFAULT_RECIPE,
      noiseTargets: ['terrainA'],
      customNoiseHex: { a: '#abcdff' },
    });
    const items = [{ id: 'user_1', name: 'Test', recipe }];
    expect(savePresets(store, items)).toEqual({ success: true });
    expect(loadPresets(store)).toEqual(items);
  });
});
