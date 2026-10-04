import { useEffect, useRef } from 'react';

/** Coalesce updates into the latest frame; cleanup cancels obsolete work. */
export function useCanvasFrame(draw: (canvas: HTMLCanvasElement) => void) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (ref.current) draw(ref.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [draw]);
  return ref;
}
