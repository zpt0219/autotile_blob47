import { useCallback, useMemo, useState } from 'react';
import { EditRevision } from '../services/EditRevision';
import type { Dispatch, SetStateAction } from 'react';
import { sanitizeRecipe, type Recipe } from '../../model/recipe';
import { deriveRecipeView } from '../../core/recipeView';
import { TRANSLATIONS, type Lang } from '../../shared/i18n';

type RecipeSetters = {
  [K in keyof Recipe as `set${Capitalize<K>}`]: Dispatch<SetStateAction<Recipe[K]>>;
};
function makeSetters(update: Dispatch<SetStateAction<Recipe>>, changed: () => void): RecipeSetters {
  const result = {} as Record<string, unknown>;
  const keys = Object.keys(sanitizeRecipe(null)) as (keyof Recipe)[];
  for (const key of keys)
    result['set' + key[0].toUpperCase() + key.slice(1)] = (value: unknown) => {
      changed();
      update((previous) =>
        sanitizeRecipe({
          ...previous,
          [key]: typeof value === 'function' ? value(previous[key]) : value,
        }),
      );
    };
  return result as RecipeSetters;
}
export function useRecipeEditor(initial: Recipe, lang: Lang) {
  const [recipe, setRecipe] = useState(() => sanitizeRecipe(initial));
  const revision = useMemo(() => new EditRevision(), []);
  const changed = useCallback(() => {
    revision.advance();
  }, [revision]);
  const setters = useMemo(() => makeSetters(setRecipe, changed), [changed]);
  const getRevision = useCallback(() => revision.read(), [revision]);
  const view = useMemo(() => deriveRecipeView(recipe), [recipe]);
  const replaceRecipe = useCallback(
    (next: Recipe) => {
      revision.advance();
      setRecipe(sanitizeRecipe(next));
    },
    [revision],
  );
  const toggleNoise = (id: Recipe['patternNoise'][number]) =>
    setters.setPatternNoise((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id],
    );
  const toggleNoiseTarget = (id: Recipe['noiseTargets'][number]) =>
    setters.setNoiseTargets((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id],
    );
  return {
    ...recipe,
    ...setters,
    ...view,
    recipe,
    replaceRecipe,
    getRevision,
    lang,
    t: TRANSLATIONS[lang],
    toggleNoise,
    toggleNoiseTarget,
  };
}
export type RecipeEditor = ReturnType<typeof useRecipeEditor>;
