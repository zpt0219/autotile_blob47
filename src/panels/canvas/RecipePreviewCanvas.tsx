import { useEffect, useRef } from 'react';
import { BLOB47_COLS, BLOB47_ROWS } from '../../core/blob47';
import {
  renderSheetRGBA,
  SHEET_TILE_SIZE,
  SHEET_WIDTH,
  SHEET_HEIGHT,
} from '../../core/renderSheet';
import { type Recipe } from '../../model/recipe';
export function RecipePreviewCanvas({
  recipe,
  displayWidth = 256,
  displayHeight = 192,
}: {
  recipe: Recipe;
  displayWidth?: number;
  displayHeight?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Shares renderSheet with the main canvas rather than mapping the recipe
    // again. The copy that used to live here had drifted: it read bandBias as
    // `(bias / 100) * (ts / 2)` instead of scaling it by the pattern's own
    // PATTERN_OFFSET_RANGE, and it knew nothing about water's two-shade table,
    // the pavings' forced amount, or DEFAULT_TEXTURE_COLOURS — so a preset's
    // thumbnail and the sheet it produced were visibly different images.
    const ts = SHEET_TILE_SIZE;
    const sheetWidth = SHEET_WIDTH;
    const sheetHeight = SHEET_HEIGHT;

    const imgData = new ImageData(renderSheetRGBA(recipe), sheetWidth, sheetHeight);
    canvas.width = sheetWidth;
    canvas.height = sheetHeight;
    ctx.putImageData(imgData, 0, 0);

    // Subtle grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let row = 1; row < BLOB47_ROWS; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * ts);
      ctx.lineTo(sheetWidth, row * ts);
      ctx.stroke();
    }
    for (let col = 1; col < BLOB47_COLS; col++) {
      ctx.beginPath();
      ctx.moveTo(col * ts, 0);
      ctx.lineTo(col * ts, sheetHeight);
      ctx.stroke();
    }
  }, [recipe]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
        imageRendering: 'pixelated',
        borderRadius: '8px',
        border: '1px solid var(--line)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.6)',
        background: '#0a0b0e',
      }}
    />
  );
}
