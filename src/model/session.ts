import type { Lang } from '../shared/i18n';

export const MAP_COLS = 16;
export const MAP_ROWS = 10;
export type PaintTool = 'paint' | 'erase';
export interface Preferences {
  lang: Lang;
  showGrid: boolean;
  showCellDots: boolean;
  zoom: number;
  playgroundZoom: number;
}
export const DEFAULT_PREFERENCES: Preferences = {
  lang: 'zh',
  showGrid: true,
  showCellDots: true,
  zoom: 2,
  playgroundZoom: 1,
};
export function emptyMap(value = 0): number[][] {
  return Array.from({ length: MAP_ROWS }, () => Array<number>(MAP_COLS).fill(value));
}
