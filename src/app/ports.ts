import type { Recipe } from '../model/recipe';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export interface ExportBackend {
  downloadRecipe(recipe: Recipe): void;
  downloadTileset(recipe: Recipe, rgba: Uint8ClampedArray<ArrayBuffer>): Promise<void>;
}
export interface SharingBackend {
  getHash(): string;
  copyLink(payload: string): Promise<string>;
}
export interface StudioPorts {
  storage: KeyValueStore;
  exports: ExportBackend;
  sharing: SharingBackend;
  prompt(message: string, initial: string): string | null;
  confirm(message: string): boolean;
}
