import { useState, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Square,
  Circle,
  Minus,
  Type,
  Image,
  Layers,
} from 'lucide-react';
import { useCanvasStore, useSelectionStore } from '@/store';
import type { Shape } from '@editor-app/shared';
import styles from './Panels.module.css';

// Shape type to icon mapping
function ShapeTypeIcon({ type }: { type: Shape['type'] }) {
  const iconProps = { size: 14 };

  switch (type) {
    case 'rectangle':
      return <Square {...iconProps} />;
    case 'circle':
      return <Circle {...iconProps} />;
    case 'line':
      return <Minus {...iconProps} />;
    case 'text':
      return <Type {...iconProps} />;
    case 'image':
      return <Image {...iconProps} />;
    default:
      return <Square {...iconProps} />;
  }
}

export function LayersPanel() {
  const {
    shapes,
    layers,
    activeLayerId,
    addLayer,
    updateLayer,
    deleteLayer,
    setActiveLayer,
    reorderLayers,
    reorderShapeInLayer,
  } = useCanvasStore();
  const { selectedIds, selectMultiple } = useSelectionStore();

  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [dragOverShapeId, setDragOverShapeId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = useCallback((
    e: React.DragEvent,
    type: 'layer' | 'shape',
    id: string,
    index: number
  ) => {
    e.dataTransfer.setData('type', type);
    e.dataTransfer.setData('id', id);
    e.dataTransfer.setData('index', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragOverLayerId(null);
    setDragOverShapeId(null);
    setDraggingId(null);
  }, []);

  const handleLayerDragOver = useCallback((e: React.DragEvent, layerId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const type = e.dataTransfer.types.includes('text/plain') ? null : 'layer';
    if (type) {
      setDragOverLayerId(layerId);
    }
  }, []);

  const handleLayerDragLeave = useCallback(() => {
    setDragOverLayerId(null);
  }, []);

  const handleLayerDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    if (type !== 'layer') return;

    const fromIndex = parseInt(e.dataTransfer.getData('index'));
    if (fromIndex !== targetIndex) {
      reorderLayers(fromIndex, targetIndex);
    }
    setDragOverLayerId(null);
    setDraggingId(null);
  }, [reorderLayers]);

  const handleShapeDragOver = useCallback((e: React.DragEvent, shapeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverShapeId(shapeId);
  }, []);

  const handleShapeDragLeave = useCallback(() => {
    setDragOverShapeId(null);
  }, []);

  const handleShapeDrop = useCallback((
    e: React.DragEvent,
    layerId: string,
    targetIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('type');
    if (type !== 'shape') return;

    const fromIndex = parseInt(e.dataTransfer.getData('index'));
    if (fromIndex !== targetIndex) {
      reorderShapeInLayer(layerId, fromIndex, targetIndex);
    }
    setDragOverShapeId(null);
    setDraggingId(null);
  }, [reorderShapeInLayer]);

  const handleShapeClick = useCallback((
    e: React.MouseEvent,
    shapeId: string,
    isSelected: boolean
  ) => {
    e.stopPropagation();
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      const newSelection = isSelected
        ? selectedIds.filter((id) => id !== shapeId)
        : [...selectedIds, shapeId];
      selectMultiple(newSelection);
    } else {
      selectMultiple([shapeId]);
    }
  }, [selectedIds, selectMultiple]);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent,
    shapeId: string,
    isSelected: boolean
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleShapeClick(e as unknown as React.MouseEvent, shapeId, isSelected);
    }
  }, [handleShapeClick]);

  return (
    <div className={styles.panel} role="region" aria-label="Layers panel">
      <div className={styles.header}>
        <span>Layers</span>
        <button
          className={styles.iconButton}
          onClick={() => addLayer()}
          aria-label="Add new layer"
        >
          <Plus size={16} />
        </button>
      </div>

      <div
        className={styles.layersList}
        role="tree"
        aria-label="Layer hierarchy"
      >
        {[...layers].reverse().map((layer, reversedIndex) => {
          const index = layers.length - 1 - reversedIndex;
          const layerShapes = layer.shapeIds.map((id) => shapes[id]).filter(Boolean);
          const isActive = activeLayerId === layer.id;
          const isDragOver = dragOverLayerId === layer.id;

          return (
            <div
              key={layer.id}
              className={`
                ${styles.layerItem}
                ${isActive ? styles.activeLayer : ''}
                ${isDragOver ? styles.dragOver : ''}
              `}
              role="treeitem"
              aria-expanded="true"
              aria-selected={isActive}
              draggable
              onDragStart={(e) => handleDragStart(e, 'layer', layer.id, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleLayerDragOver(e, layer.id)}
              onDragLeave={handleLayerDragLeave}
              onDrop={(e) => handleLayerDrop(e, index)}
              onClick={() => setActiveLayer(layer.id)}
            >
              <div className={styles.layerHeader}>
                <button
                  className={`${styles.iconButton} ${layer.visible ? '' : styles.active}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { visible: !layer.visible });
                  }}
                  aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                  aria-pressed={!layer.visible}
                >
                  {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  className={`${styles.iconButton} ${layer.locked ? styles.active : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { locked: !layer.locked });
                  }}
                  aria-label={layer.locked ? 'Unlock layer' : 'Lock layer'}
                  aria-pressed={layer.locked}
                >
                  {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                <Layers size={14} style={{ color: 'var(--text-tertiary)', marginRight: 4 }} aria-hidden="true" />
                <span className={styles.layerName}>{layer.name}</span>
                <button
                  className={`${styles.iconButton} ${styles.danger}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(layer.id);
                  }}
                  disabled={layers.length <= 1}
                  aria-label="Delete layer"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {layerShapes.length > 0 && (
                <div className={styles.shapesList} role="group" aria-label={`Shapes in ${layer.name}`}>
                  {[...layerShapes].reverse().map((shape, reversedShapeIndex) => {
                    const shapeIndex = layerShapes.length - 1 - reversedShapeIndex;
                    const isSelected = selectedIds.includes(shape.id);
                    const isShapeDragOver = dragOverShapeId === shape.id;
                    const isDragging = draggingId === shape.id;

                    return (
                      <div
                        key={shape.id}
                        className={`
                          ${styles.shapeItem}
                          ${isSelected ? styles.selectedShape : ''}
                          ${isShapeDragOver ? styles.dragOver : ''}
                          ${isDragging ? styles.dragging : ''}
                        `}
                        role="treeitem"
                        aria-selected={isSelected}
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'shape', shape.id, shapeIndex)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleShapeDragOver(e, shape.id)}
                        onDragLeave={handleShapeDragLeave}
                        onDrop={(e) => handleShapeDrop(e, layer.id, shapeIndex)}
                        onClick={(e) => handleShapeClick(e, shape.id, isSelected)}
                        onKeyDown={(e) => handleKeyDown(e, shape.id, isSelected)}
                      >
                        <div className={styles.shapeTypeIcon} aria-hidden="true">
                          <ShapeTypeIcon type={shape.type} />
                        </div>
                        <div
                          className={styles.shapePreview}
                          style={{
                            backgroundColor: 'fill' in shape ? shape.fill : 'transparent',
                            borderColor: 'stroke' in shape ? shape.stroke : 'var(--border-color)',
                          }}
                          aria-hidden="true"
                        />
                        <span className={styles.shapeName}>{shape.name}</span>
                        <button
                          className={`${styles.iconButton} ${!shape.visible ? styles.active : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            useCanvasStore.getState().updateShape(shape.id, {
                              visible: !shape.visible,
                            });
                          }}
                          aria-label={shape.visible ? 'Hide shape' : 'Show shape'}
                          aria-pressed={!shape.visible}
                        >
                          {shape.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        className={styles.addLayerButton}
        onClick={() => addLayer()}
        aria-label="Add new layer"
      >
        <Plus size={16} />
        <span>Add Layer</span>
      </button>
    </div>
  );
}
