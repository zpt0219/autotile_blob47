import { useCallback, useRef } from 'react';
import type { Studio } from '../../app/state/useStudio';
import type { RenderedTileset } from '../../core/renderMap';
import { SHEET_WIDTH, SHEET_HEIGHT, SHEET_TILE_SIZE } from '../../core/renderSheet';
import { drawGrid, drawPixels } from '../../app/browser/canvas';
import { useCanvasFrame } from './useCanvasFrame';

export function TilesetPanel({ studio, tiles }: { studio: Studio; tiles: RenderedTileset }) {
  const { preferences, setPreferences, editor, busy } = studio;
  const t = editor.t;
  const input = useRef<HTMLInputElement | null>(null);
  const draw = useCallback(
    (canvas: HTMLCanvasElement) => {
      drawPixels(canvas, tiles.sheet, SHEET_WIDTH, SHEET_HEIGHT);
      if (preferences.showGrid) drawGrid(canvas, SHEET_TILE_SIZE);
    },
    [tiles, preferences.showGrid],
  );
  const ref = useCanvasFrame(draw);
  return (
    <section className="panel-card preview-card">
      <div className="canvas-heading">
        <h2 className="panel-title">{t.tilesetPreview}</h2>
        <label className="checkbox-group">
          <input
            type="checkbox"
            checked={preferences.showGrid}
            onChange={(e) => setPreferences((p) => ({ ...p, showGrid: e.target.checked }))}
          />
          {t.showGrid}
        </label>
        <div className="scale-tabs">
          {[1, 2, 4, 8].map((n) => (
            <button
              key={n}
              className={`scale-tab-btn ${preferences.zoom === n ? 'active' : ''}`}
              onClick={() => setPreferences((p) => ({ ...p, zoom: n }))}
            >
              {n}x
            </button>
          ))}
        </div>
      </div>
      <div className="canvas-container">
        <canvas
          aria-label="Blob47 tileset"
          ref={ref}
          className="tileset-canvas"
          style={{ width: SHEET_WIDTH * preferences.zoom, height: SHEET_HEIGHT * preferences.zoom }}
        />
      </div>
      <div className="action-bar">
        <button className="btn-action btn-secondary" onClick={() => input.current?.click()}>
          {t.importRecipe}
        </button>
        <button className="btn-action btn-secondary" onClick={studio.downloadRecipe}>
          {t.exportRecipe}
        </button>
        <button
          className="btn-action"
          disabled={busy}
          onClick={() => void studio.downloadTilesetBundle()}
        >
          {busy ? (editor.lang === 'zh' ? '正在打包…' : 'Exporting…') : '💾 ' + t.downloadBundle}
        </button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          aria-label="Import recipe file"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void studio.importRecipe(file);
          }}
        />
      </div>
    </section>
  );
}
