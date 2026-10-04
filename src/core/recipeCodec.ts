import { strToU8, strFromU8, zlibSync, unzlibSync } from 'fflate';
import { DEFAULT_RECIPE, sanitizeRecipe, type Recipe } from '../model/recipe';

export const RECIPE_FORMAT = 'autotile-blob47-recipe';
export const RECIPE_VERSION = 1;
export const SHARE_HASH = '#blob47=';
export interface RecipeFile {
  format: typeof RECIPE_FORMAT;
  version: typeof RECIPE_VERSION;
  recipe: Recipe;
}

// Stable object ordering makes comparison independent of JSON property order.
function stable(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map((v) => stable(v ?? null)).join(',') + ']';
  if (value && typeof value === 'object') {
    return (
      '{' +
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ':' + stable(v))
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(value);
}
export function validateRecipe(raw: unknown): Recipe {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('配方必须是对象 / Recipe must be an object');
  if (!Object.keys(DEFAULT_RECIPE).every((k) => Object.hasOwn(raw, k)))
    throw new Error('配方字段不完整 / Incomplete recipe');
  const recipe = sanitizeRecipe(raw);
  if (stable(raw) !== stable(recipe)) throw new Error('配方参数无效 / Invalid recipe parameters');
  return recipe;
}
export function recipeFile(recipe: Recipe): RecipeFile {
  return { format: RECIPE_FORMAT, version: RECIPE_VERSION, recipe: sanitizeRecipe(recipe) };
}
export function readRecipeFile(value: unknown): Recipe {
  if (!value || typeof value !== 'object') throw new Error('无效配方文件 / Invalid recipe file');
  const file = value as Record<string, unknown>;
  if (file.format !== RECIPE_FORMAT || file.version !== RECIPE_VERSION)
    throw new Error('不支持的配方格式 / Unsupported recipe format');
  return validateRecipe(file.recipe);
}
export function parseRecipeFile(text: string): Recipe {
  return readRecipeFile(JSON.parse(text));
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function encodeBytes(bytes: Uint8Array): string {
  let out = '',
    bits = 0,
    acc = 0;
  for (const byte of bytes) {
    acc = (acc << 8) | byte;
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      out += ALPHABET[(acc >>> bits) & 63];
    }
  }
  if (bits) out += ALPHABET[(acc << (6 - bits)) & 63];
  return out;
}
function decodeBytes(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(text) || text.length > 100_000 || text.length % 4 === 1)
    throw new Error('无效分享编码 / Invalid share payload');
  const bytes: number[] = [];
  let bits = 0,
    acc = 0;
  for (const char of text) {
    acc = (acc << 6) | ALPHABET.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((acc >>> bits) & 255);
    }
  }
  return new Uint8Array(bytes);
}
export function encodeRecipe(recipe: Recipe): string {
  return 'b1.' + encodeBytes(zlibSync(strToU8(JSON.stringify(recipeFile(recipe)))));
}
export function decodeRecipe(payload: string): Recipe {
  if (!payload.startsWith('b1.')) throw new Error('不支持的分享版本 / Unsupported share version');
  return parseRecipeFile(strFromU8(unzlibSync(decodeBytes(payload.slice(3)))));
}
export function recipesEqual(a: Recipe, b: Recipe): boolean {
  return stable(a) === stable(b);
}
