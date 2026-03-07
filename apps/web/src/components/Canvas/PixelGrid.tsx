import { useEffect, useRef } from 'react';
import type { Viewport } from '@editor-app/shared';
import { getWorldPixelSize, alignToDevicePixel } from '@/utils/snap';

interface PixelGridProps {
  viewport: Viewport;
  width: number;
  height: number;
}

export function PixelGrid({ viewport, width, height }: PixelGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const { showGrid, gridOpacity } = getWorldPixelSize(viewport.scale, dpr);

    // Size canvas to match container in device pixels
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showGrid) return;

    // Scale context to device pixels so we draw in CSS pixel units
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = viewport.scale;

    // Visible world range
    const worldLeft = -viewport.x / scale;
    const worldTop = -viewport.y / scale;
    const worldRight = (width - viewport.x) / scale;
    const worldBottom = (height - viewport.y) / scale;

    const firstCol = Math.floor(worldLeft);
    const lastCol = Math.ceil(worldRight);
    const firstRow = Math.floor(worldTop);
    const lastRow = Math.ceil(worldBottom);

    ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity * 0.3})`;
    ctx.lineWidth = 1 / dpr;

    // Vertical lines
    ctx.beginPath();
    for (let col = firstCol; col <= lastCol; col++) {
      const screenX = col * scale + viewport.x;
      const alignedX = alignToDevicePixel(screenX, dpr);
      ctx.moveTo(alignedX, 0);
      ctx.lineTo(alignedX, height);
    }
    ctx.stroke();

    // Horizontal lines
    ctx.beginPath();
    for (let row = firstRow; row <= lastRow; row++) {
      const screenY = row * scale + viewport.y;
      const alignedY = alignToDevicePixel(screenY, dpr);
      ctx.moveTo(0, alignedY);
      ctx.lineTo(width, alignedY);
    }
    ctx.stroke();
  }, [viewport.x, viewport.y, viewport.scale, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        pointerEvents: 'none',
      }}
    />
  );
}
