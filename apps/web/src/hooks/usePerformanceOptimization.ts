import { useCallback, useMemo } from 'react';
import { useCanvasStore } from '@/store';
import type { Shape } from '@editor-app/shared';

interface ViewportBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function usePerformanceOptimization(stageWidth: number, stageHeight: number) {
  const { shapes, layers, viewport } = useCanvasStore();

  const viewportBounds = useMemo((): ViewportBounds => {
    const scale = viewport.scale;
    const padding = 100;

    return {
      left: -viewport.x / scale - padding,
      right: (-viewport.x + stageWidth) / scale + padding,
      top: -viewport.y / scale - padding,
      bottom: (-viewport.y + stageHeight) / scale + padding,
    };
  }, [viewport, stageWidth, stageHeight]);

  const isShapeInViewport = useCallback(
    (shape: Shape): boolean => {
      let shapeX = shape.x;
      let shapeY = shape.y;
      let shapeWidth = 0;
      let shapeHeight = 0;

      if ('width' in shape && 'height' in shape) {
        shapeWidth = shape.width * shape.scaleX;
        shapeHeight = shape.height * shape.scaleY;
      } else if ('radiusX' in shape && 'radiusY' in shape) {
        shapeWidth = shape.radiusX * 2 * shape.scaleX;
        shapeHeight = shape.radiusY * 2 * shape.scaleY;
        shapeX -= shape.radiusX * shape.scaleX;
        shapeY -= shape.radiusY * shape.scaleY;
      } else if ('points' in shape && shape.points.length >= 2) {
        const xs = shape.points.filter((_, i) => i % 2 === 0);
        const ys = shape.points.filter((_, i) => i % 2 === 1);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        shapeX += minX * shape.scaleX;
        shapeY += minY * shape.scaleY;
        shapeWidth = (maxX - minX) * shape.scaleX;
        shapeHeight = (maxY - minY) * shape.scaleY;
      } else {
        // For shapes without clear dimensions, always render
        return true;
      }

      return !(
        shapeX + shapeWidth < viewportBounds.left ||
        shapeX > viewportBounds.right ||
        shapeY + shapeHeight < viewportBounds.top ||
        shapeY > viewportBounds.bottom
      );
    },
    [viewportBounds]
  );

  const getVisibleShapes = useCallback((): Shape[] => {
    const visibleShapes: Shape[] = [];

    layers.forEach((layer) => {
      if (!layer.visible) return;

      layer.shapeIds.forEach((shapeId) => {
        const shape = shapes[shapeId];
        if (shape && shape.visible && isShapeInViewport(shape)) {
          visibleShapes.push(shape);
        }
      });
    });

    return visibleShapes;
  }, [shapes, layers, isShapeInViewport]);

  const shouldCacheShape = useCallback((shape: Shape): boolean => {
    // Cache complex shapes that don't change often
    if (shape.type === 'image') return true;
    if (shape.type === 'text' && shape.text.length > 100) return true;
    if ('points' in shape && shape.points.length > 20) return true;
    return false;
  }, []);

  return {
    viewportBounds,
    isShapeInViewport,
    getVisibleShapes,
    shouldCacheShape,
  };
}
