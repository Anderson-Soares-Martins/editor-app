import { useCallback } from 'react';
import { useCanvasStore, useSelectionStore } from '@/store';
import type { Shape } from '@editor-app/shared';

export function useSelection() {
  const { shapes, layers } = useCanvasStore();
  const {
    selectedIds,
    select,
    selectMultiple,
    selectAll,
    clearSelection,
    toggleSelection,
    isSelected,
  } = useSelectionStore();

  const getSelectedShapes = useCallback((): Shape[] => {
    return selectedIds
      .map((id) => shapes[id])
      .filter((shape): shape is Shape => shape !== undefined);
  }, [selectedIds, shapes]);

  const getAllShapeIds = useCallback((): string[] => {
    const allIds: string[] = [];
    layers.forEach((layer) => {
      if (layer.visible && !layer.locked) {
        layer.shapeIds.forEach((id) => {
          const shape = shapes[id];
          if (shape && shape.visible && !shape.locked) {
            allIds.push(id);
          }
        });
      }
    });
    return allIds;
  }, [layers, shapes]);

  const handleSelectAll = useCallback(() => {
    const allIds = getAllShapeIds();
    selectAll(allIds);
  }, [getAllShapeIds, selectAll]);

  const getShapesInBounds = useCallback(
    (bounds: { x: number; y: number; width: number; height: number }): string[] => {
      const shapeIds: string[] = [];

      Object.values(shapes).forEach((shape) => {
        const layer = layers.find((l) => l.id === shape.layerId);
        if (!layer?.visible || layer.locked || !shape.visible || shape.locked) {
          return;
        }

        let shapeWidth = 0;
        let shapeHeight = 0;
        let shapeX = shape.x;
        let shapeY = shape.y;

        if ('width' in shape && 'height' in shape) {
          shapeWidth = shape.width;
          shapeHeight = shape.height;
        } else if ('radiusX' in shape && 'radiusY' in shape) {
          shapeWidth = shape.radiusX * 2;
          shapeHeight = shape.radiusY * 2;
          shapeX = shape.x - shape.radiusX;
          shapeY = shape.y - shape.radiusY;
        } else if ('points' in shape && shape.points.length >= 4) {
          const xs = shape.points.filter((_, i) => i % 2 === 0);
          const ys = shape.points.filter((_, i) => i % 2 === 1);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          shapeX = shape.x + minX;
          shapeY = shape.y + minY;
          shapeWidth = maxX - minX;
          shapeHeight = maxY - minY;
        }

        const shapeBounds = {
          left: shapeX,
          right: shapeX + shapeWidth,
          top: shapeY,
          bottom: shapeY + shapeHeight,
        };

        const selectionBounds = {
          left: bounds.x,
          right: bounds.x + bounds.width,
          top: bounds.y,
          bottom: bounds.y + bounds.height,
        };

        const intersects =
          shapeBounds.left < selectionBounds.right &&
          shapeBounds.right > selectionBounds.left &&
          shapeBounds.top < selectionBounds.bottom &&
          shapeBounds.bottom > selectionBounds.top;

        if (intersects) {
          shapeIds.push(shape.id);
        }
      });

      return shapeIds;
    },
    [shapes, layers]
  );

  return {
    selectedIds,
    selectedShapes: getSelectedShapes(),
    select,
    selectMultiple,
    selectAll: handleSelectAll,
    clearSelection,
    toggleSelection,
    isSelected,
    getShapesInBounds,
    getAllShapeIds,
  };
}
