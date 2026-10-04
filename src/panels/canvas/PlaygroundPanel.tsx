import { useCallback, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Studio } from '../../app/state/useStudio';
import { renderMapRGBA, type RenderedTileset } from '../../core/renderMap';
import { SHEET_TILE_SIZE } from '../../core/renderSheet';
import { cellsAlongSegment, type GridCell } from '../../core/playgroundPaint';
import { MAP_COLS, MAP_ROWS, emptyMap, type PaintTool } from '../../model/session';
import { drawPixels, drawMarkers } from '../../app/browser/canvas';
import { useCanvasFrame } from './useCanvasFrame';

export function PlaygroundPanel({ studio, tiles }: { studio: Studio; tiles: RenderedTileset }) {
  const [cells, setCells] = useState(emptyMap);
  const [tool, setTool] = useState<PaintTool>('paint');
  const stroke = useRef<{ pointer: number; previous: GridCell; value: number } | null>(null);
  const { preferences, setPreferences, editor } = studio;
  const t = editor.t,
    ts = SHEET_TILE_SIZE;
  const pixels = useMemo(() => renderMapRGBA(cells, tiles), [cells, tiles]);
  const draw = useCallback(
    (canvas: HTMLCanvasElement) => {
      drawPixels(canvas, pixels, MAP_COLS * ts, MAP_ROWS * ts);
      if (preferences.showCellDots) drawMarkers(canvas, cells, ts);
    },
    [pixels, cells, preferences.showCellDots, ts],
  );
  const ref = useCanvasFrame(draw);
  const position = (e: PointerEvent<HTMLCanvasElement>): GridCell => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      col: Math.floor(((e.clientX - rect.left) / rect.width) * MAP_COLS),
      row: Math.floor(((e.clientY - rect.top) / rect.height) * MAP_ROWS),
    };
  };
  const paint = (current: GridCell, previous: GridCell | null, value: number) => {
    const segment = previous ? cellsAlongSegment(previous, current) : [current];
    const valid = segment.filter(
      (c) => c.col >= 0 && c.col < MAP_COLS && c.row >= 0 && c.row < MAP_ROWS,
    );
    setCells((prev) => {
      if (valid.every((c) => prev[c.row][c.col] === value)) return prev;
      const next = prev.map((row) => [...row]);
      valid.forEach((c) => {
        next[c.row][c.col] = value;
      });
      return next;
    });
  };
  const stop = (e: PointerEvent<HTMLCanvasElement>) => {
    if (stroke.current?.pointer !== e.pointerId) return;
    stroke.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const reset = (value: number) => {
    stroke.current = null;
    setCells(emptyMap(value));
  };
  return (
    <section className="panel-card playground-panel">
      <div className="canvas-heading">
        <h2 className="panel-title">{t.playgroundTitle}</h2>
        <label className="checkbox-group">
          <input
            type="checkbox"
            checked={preferences.showCellDots}
            onChange={(e) => setPreferences((p) => ({ ...p, showCellDots: e.target.checked }))}
          />
          {t.showCellDots}
        </label>
        <div className="scale-tabs">
          {[1, 2, 4, 8].map((n) => (
            <button
              key={n}
              className={`scale-tab-btn ${preferences.playgroundZoom === n ? 'active' : ''}`}
              onClick={() => setPreferences((p) => ({ ...p, playgroundZoom: n }))}
            >
              {n}x
            </button>
          ))}
        </div>
      </div>
      <p className="playground-tip">{t.playgroundTip}</p>
      <div className="playground-canvas-wrapper">
        <canvas
          ref={ref}
          aria-label="Blob47 playground"
          className="playground-canvas"
          style={{
            width: MAP_COLS * ts * preferences.playgroundZoom,
            height: MAP_ROWS * ts * preferences.playgroundZoom,
            touchAction: 'none',
          }}
          onPointerDown={(e) => {
            if (stroke.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
            e.preventDefault();
            const current = position(e),
              value = tool === 'paint' ? 1 : 0;
            e.currentTarget.setPointerCapture(e.pointerId);
            stroke.current = { pointer: e.pointerId, previous: current, value };
            paint(current, null, value);
          }}
          onPointerMove={(e) => {
            const s = stroke.current;
            if (!s || s.pointer !== e.pointerId) return;
            const current = position(e);
            paint(current, s.previous, s.value);
            s.previous = current;
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onLostPointerCapture={stop}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      <div className="playground-tools">
        <button
          className={`btn-action btn-secondary tool-btn ${tool === 'paint' ? 'active' : ''}`}
          onClick={() => setTool('paint')}
        >
          {t.paintTool}
        </button>
        <button
          className={`btn-action btn-secondary tool-btn ${tool === 'erase' ? 'active' : ''}`}
          onClick={() => setTool('erase')}
        >
          {t.eraseTool}
        </button>
        <button className="btn-action btn-secondary" onClick={() => reset(1)}>
          {t.fillPlaygroundA}
        </button>
        <button className="btn-action btn-secondary" onClick={() => reset(0)}>
          {t.clearPlayground}
        </button>
      </div>
    </section>
  );
}
