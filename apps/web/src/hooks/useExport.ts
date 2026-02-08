import { useCallback } from 'react';
import { useCanvasStore } from '@/store';

export function useExport() {
  const { shapes, layers } = useCanvasStore();

  const exportToPNG = useCallback(() => {
    const stage = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement;
    if (!stage) return;

    const link = document.createElement('a');
    link.download = 'canvas-export.png';
    link.href = stage.toDataURL('image/png');
    link.click();
  }, []);

  const exportToJPEG = useCallback(() => {
    const stage = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement;
    if (!stage) return;

    const link = document.createElement('a');
    link.download = 'canvas-export.jpg';
    link.href = stage.toDataURL('image/jpeg', 0.9);
    link.click();
  }, []);

  const exportToSVG = useCallback(() => {
    const svgElements: string[] = [];

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    // Calculate bounds
    Object.values(shapes).forEach((shape) => {
      if (!shape.visible) return;

      const layer = layers.find((l) => l.id === shape.layerId);
      if (!layer?.visible) return;

      let width = 0,
        height = 0,
        x = shape.x,
        y = shape.y;

      if ('width' in shape) {
        width = shape.width;
        height = shape.height;
      } else if ('radiusX' in shape) {
        width = shape.radiusX * 2;
        height = shape.radiusY * 2;
        x -= shape.radiusX;
        y -= shape.radiusY;
      } else if ('points' in shape && shape.points.length >= 4) {
        const xs = shape.points.filter((_, i) => i % 2 === 0);
        const ys = shape.points.filter((_, i) => i % 2 === 1);
        width = Math.max(...xs) - Math.min(...xs);
        height = Math.max(...ys) - Math.min(...ys);
        x += Math.min(...xs);
        y += Math.min(...ys);
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    const padding = 20;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    // Generate SVG elements for each shape
    layers.forEach((layer) => {
      if (!layer.visible) return;

      layer.shapeIds.forEach((shapeId) => {
        const shape = shapes[shapeId];
        if (!shape || !shape.visible) return;

        const transform = `translate(${shape.x + offsetX}, ${shape.y + offsetY}) rotate(${shape.rotation})`;
        const opacity = shape.opacity;

        switch (shape.type) {
          case 'rectangle':
            svgElements.push(
              `<rect x="0" y="0" width="${shape.width}" height="${shape.height}" ` +
                `fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" ` +
                `rx="${shape.cornerRadius}" transform="${transform}" opacity="${opacity}"/>`
            );
            break;

          case 'circle':
            svgElements.push(
              `<ellipse cx="0" cy="0" rx="${shape.radiusX}" ry="${shape.radiusY}" ` +
                `fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" ` +
                `transform="${transform}" opacity="${opacity}"/>`
            );
            break;

          case 'line':
            const points = shape.points;
            if (points.length >= 4) {
              svgElements.push(
                `<line x1="${points[0]}" y1="${points[1]}" x2="${points[2]}" y2="${points[3]}" ` +
                  `stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" ` +
                  `stroke-linecap="${shape.lineCap}" transform="${transform}" opacity="${opacity}"/>`
              );
            }
            break;

          case 'text':
            svgElements.push(
              `<text x="0" y="${shape.fontSize}" font-size="${shape.fontSize}" ` +
                `font-family="${shape.fontFamily}" fill="${shape.fill}" ` +
                `transform="${transform}" opacity="${opacity}">${escapeXml(shape.text)}</text>`
            );
            break;

          case 'image':
            svgElements.push(
              `<image href="${shape.src}" width="${shape.width}" height="${shape.height}" ` +
                `transform="${transform}" opacity="${opacity}"/>`
            );
            break;
        }
      });
    });

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${svgElements.join('\n  ')}
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'canvas-export.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [shapes, layers]);

  return {
    exportToPNG,
    exportToJPEG,
    exportToSVG,
  };
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
