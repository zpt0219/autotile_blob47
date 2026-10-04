export function drawPixels(
  canvas: HTMLCanvasElement,
  rgba: Uint8ClampedArray<ArrayBuffer>,
  width: number,
  height: number,
): void {
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
}
export function drawGrid(canvas: HTMLCanvasElement, tileSize: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = tileSize; x < canvas.width; x += tileSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = tileSize; y < canvas.height; y += tileSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
}
export function drawMarkers(
  canvas: HTMLCanvasElement,
  cells: readonly (readonly number[])[],
  tileSize: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  cells.forEach((row, y) =>
    row.forEach((cell, x) => {
      ctx.beginPath();
      ctx.arc((x + 0.5) * tileSize, (y + 0.5) * tileSize, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = cell ? '#22c55e' : '#78350f';
      ctx.fill();
      ctx.stroke();
    }),
  );
}
