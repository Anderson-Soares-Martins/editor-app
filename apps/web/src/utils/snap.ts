import type { Viewport } from '@editor-app/shared';

// ── Coordinate conversions ──────────────────────────────────────────

export function worldToScreen(
  pt: { x: number; y: number },
  viewport: Viewport,
): { x: number; y: number } {
  return {
    x: pt.x * viewport.scale + viewport.x,
    y: pt.y * viewport.scale + viewport.y,
  };
}

export function screenToWorld(
  pt: { x: number; y: number },
  viewport: Viewport,
): { x: number; y: number } {
  return {
    x: (pt.x - viewport.x) / viewport.scale,
    y: (pt.y - viewport.y) / viewport.scale,
  };
}

// ── Pixel grid visibility ───────────────────────────────────────────

const GRID_MIN_CELL_SCREEN_PX = 4;
const GRID_FADE_RANGE = 4;

export function getWorldPixelSize(
  zoom: number,
  dpr: number = 1,
): {
  cellScreenPx: number;
  cellDevicePx: number;
  showGrid: boolean;
  gridOpacity: number;
} {
  const cellScreenPx = zoom;
  const cellDevicePx = zoom * dpr;
  const showGrid = cellScreenPx >= GRID_MIN_CELL_SCREEN_PX;
  const gridOpacity = Math.min(
    Math.max((cellScreenPx - GRID_MIN_CELL_SCREEN_PX) / GRID_FADE_RANGE, 0),
    1,
  );

  return { cellScreenPx, cellDevicePx, showGrid, gridOpacity };
}

// ── Device pixel alignment ──────────────────────────────────────────

export function alignToDevicePixel(cssPx: number, dpr: number): number {
  const devicePx = cssPx * dpr;
  const aligned = Math.floor(devicePx) + 0.5;
  return aligned / dpr;
}

// ── Snap functions ──────────────────────────────────────────────────

export function snapValue(
  v: number,
  step: number = 1,
  origin: number = 0,
): number {
  return Math.round((v - origin) / step) * step + origin;
}

export function snapPoint(pt: { x: number; y: number }): {
  x: number;
  y: number;
} {
  return { x: Math.round(pt.x), y: Math.round(pt.y) };
}

export function snapRect(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { x: number; y: number; width: number; height: number } {
  const left = Math.round(rect.x);
  const top = Math.round(rect.y);
  const right = Math.round(rect.x + rect.width);
  const bottom = Math.round(rect.y + rect.height);
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}
