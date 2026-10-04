import type { KeyValueStore } from '../ports';

export class BrowserStorage implements KeyValueStore {
  getItem(key: string): string | null {
    return window.localStorage.getItem(key);
  }
  setItem(key: string, value: string): void {
    window.localStorage.setItem(key, value);
  }
}
