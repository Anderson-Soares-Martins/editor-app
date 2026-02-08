import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Shape, Layer, Viewport, CanvasState } from '@editor-app/shared';

interface CanvasStore extends CanvasState {
  viewport: Viewport;

  // Shape actions
  addShape: (shape: Omit<Shape, 'id'>) => string;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  deleteShapes: (ids: string[]) => void;
  duplicateShapes: (ids: string[]) => string[];

  // Layer actions
  addLayer: (name?: string) => string;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  setActiveLayer: (id: string | null) => void;
  moveShapeToLayer: (shapeId: string, layerId: string) => void;
  reorderShapeInLayer: (layerId: string, fromIndex: number, toIndex: number) => void;

  // Viewport actions
  setViewport: (viewport: Partial<Viewport>) => void;
  zoomTo: (scale: number, centerX?: number, centerY?: number) => void;
  panBy: (dx: number, dy: number) => void;
  fitToScreen: (stageWidth: number, stageHeight: number) => void;

  // State management
  getState: () => CanvasState;
  setState: (state: Partial<CanvasState>) => void;
  reset: () => void;
}

const DEFAULT_LAYER_ID = 'layer-1';

const initialState: CanvasState & { viewport: Viewport } = {
  shapes: {},
  layers: [
    {
      id: DEFAULT_LAYER_ID,
      name: 'Layer 1',
      visible: true,
      locked: false,
      shapeIds: [],
    },
  ],
  activeLayerId: DEFAULT_LAYER_ID,
  viewport: {
    x: 0,
    y: 0,
    scale: 1,
  },
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  ...initialState,

  addShape: (shapeData) => {
    const id = nanoid();
    const shape = { ...shapeData, id } as Shape;
    const activeLayerId = get().activeLayerId || get().layers[0]?.id;

    if (!activeLayerId) {
      console.error('No active layer');
      return id;
    }

    set((state) => ({
      shapes: { ...state.shapes, [id]: { ...shape, layerId: activeLayerId } },
      layers: state.layers.map((layer) =>
        layer.id === activeLayerId
          ? { ...layer, shapeIds: [...layer.shapeIds, id] }
          : layer
      ),
    }));

    return id;
  },

  updateShape: (id, updates) => {
    set((state) => {
      const shape = state.shapes[id];
      if (!shape) return state;
      return {
        shapes: { ...state.shapes, [id]: { ...shape, ...updates } as Shape },
      };
    });
  },

  deleteShape: (id) => {
    set((state) => {
      const shape = state.shapes[id];
      if (!shape) return state;

      const { [id]: _, ...remainingShapes } = state.shapes;
      return {
        shapes: remainingShapes,
        layers: state.layers.map((layer) => ({
          ...layer,
          shapeIds: layer.shapeIds.filter((shapeId) => shapeId !== id),
        })),
      };
    });
  },

  deleteShapes: (ids) => {
    set((state) => {
      const idsSet = new Set(ids);
      const remainingShapes = { ...state.shapes };
      ids.forEach((id) => delete remainingShapes[id]);

      return {
        shapes: remainingShapes,
        layers: state.layers.map((layer) => ({
          ...layer,
          shapeIds: layer.shapeIds.filter((shapeId) => !idsSet.has(shapeId)),
        })),
      };
    });
  },

  duplicateShapes: (ids) => {
    const newIds: string[] = [];

    set((state) => {
      const newShapes = { ...state.shapes };
      const layerUpdates: Record<string, string[]> = {};

      ids.forEach((id) => {
        const shape = state.shapes[id];
        if (!shape) return;

        const newId = nanoid();
        newIds.push(newId);

        newShapes[newId] = {
          ...shape,
          id: newId,
          x: shape.x + 20,
          y: shape.y + 20,
          name: `${shape.name} Copy`,
        };

        if (!layerUpdates[shape.layerId]) {
          const layer = state.layers.find((l) => l.id === shape.layerId);
          layerUpdates[shape.layerId] = layer ? [...layer.shapeIds] : [];
        }
        layerUpdates[shape.layerId].push(newId);
      });

      return {
        shapes: newShapes,
        layers: state.layers.map((layer) =>
          layerUpdates[layer.id]
            ? { ...layer, shapeIds: layerUpdates[layer.id] }
            : layer
        ),
      };
    });

    return newIds;
  },

  addLayer: (name) => {
    const id = nanoid();
    const layerCount = get().layers.length + 1;

    set((state) => ({
      layers: [
        ...state.layers,
        {
          id,
          name: name || `Layer ${layerCount}`,
          visible: true,
          locked: false,
          shapeIds: [],
        },
      ],
      activeLayerId: id,
    }));

    return id;
  },

  updateLayer: (id, updates) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer
      ),
    }));
  },

  deleteLayer: (id) => {
    const state = get();
    if (state.layers.length <= 1) return;

    const layer = state.layers.find((l) => l.id === id);
    if (!layer) return;

    const shapesToDelete = new Set(layer.shapeIds);
    const remainingShapes = { ...state.shapes };
    shapesToDelete.forEach((shapeId) => delete remainingShapes[shapeId]);

    const remainingLayers = state.layers.filter((l) => l.id !== id);
    const newActiveLayerId =
      state.activeLayerId === id
        ? remainingLayers[0]?.id || null
        : state.activeLayerId;

    set({
      shapes: remainingShapes,
      layers: remainingLayers,
      activeLayerId: newActiveLayerId,
    });
  },

  reorderLayers: (fromIndex, toIndex) => {
    set((state) => {
      const layers = [...state.layers];
      const [removed] = layers.splice(fromIndex, 1);
      layers.splice(toIndex, 0, removed);
      return { layers };
    });
  },

  setActiveLayer: (id) => {
    set({ activeLayerId: id });
  },

  moveShapeToLayer: (shapeId, layerId) => {
    set((state) => {
      const shape = state.shapes[shapeId];
      if (!shape || shape.layerId === layerId) return state;

      return {
        shapes: { ...state.shapes, [shapeId]: { ...shape, layerId } },
        layers: state.layers.map((layer) => {
          if (layer.id === shape.layerId) {
            return {
              ...layer,
              shapeIds: layer.shapeIds.filter((id) => id !== shapeId),
            };
          }
          if (layer.id === layerId) {
            return { ...layer, shapeIds: [...layer.shapeIds, shapeId] };
          }
          return layer;
        }),
      };
    });
  },

  reorderShapeInLayer: (layerId, fromIndex, toIndex) => {
    set((state) => ({
      layers: state.layers.map((layer) => {
        if (layer.id !== layerId) return layer;
        const shapeIds = [...layer.shapeIds];
        const [removed] = shapeIds.splice(fromIndex, 1);
        shapeIds.splice(toIndex, 0, removed);
        return { ...layer, shapeIds };
      }),
    }));
  },

  setViewport: (viewport) => {
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    }));
  },

  zoomTo: (scale, centerX, centerY) => {
    set((state) => {
      const clampedScale = Math.min(Math.max(scale, 0.1), 10);

      if (centerX !== undefined && centerY !== undefined) {
        const scaleRatio = clampedScale / state.viewport.scale;
        const newX = centerX - (centerX - state.viewport.x) * scaleRatio;
        const newY = centerY - (centerY - state.viewport.y) * scaleRatio;

        return {
          viewport: {
            x: newX,
            y: newY,
            scale: clampedScale,
          },
        };
      }

      return {
        viewport: { ...state.viewport, scale: clampedScale },
      };
    });
  },

  panBy: (dx, dy) => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x + dx,
        y: state.viewport.y + dy,
      },
    }));
  },

  fitToScreen: (stageWidth, stageHeight) => {
    const shapes = Object.values(get().shapes);
    if (shapes.length === 0) {
      set({ viewport: { x: 0, y: 0, scale: 1 } });
      return;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    shapes.forEach((shape) => {
      const width = 'width' in shape ? shape.width : ('radiusX' in shape ? shape.radiusX * 2 : 100);
      const height = 'height' in shape ? shape.height : ('radiusY' in shape ? shape.radiusY * 2 : 100);

      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + width);
      maxY = Math.max(maxY, shape.y + height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 50;

    const scaleX = (stageWidth - padding * 2) / contentWidth;
    const scaleY = (stageHeight - padding * 2) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    set({
      viewport: {
        x: stageWidth / 2 - centerX * scale,
        y: stageHeight / 2 - centerY * scale,
        scale,
      },
    });
  },

  getState: () => {
    const state = get();
    return {
      shapes: state.shapes,
      layers: state.layers,
      activeLayerId: state.activeLayerId,
    };
  },

  setState: (state) => {
    set(state);
  },

  reset: () => {
    set(initialState);
  },
}));
