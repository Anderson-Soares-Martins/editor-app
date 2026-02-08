import { Eye, EyeOff, Lock, Unlock, Plus, Trash2 } from 'lucide-react';
import { useCanvasStore, useSelectionStore } from '@/store';
import styles from './Panels.module.css';

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

  const handleDragStart = (e: React.DragEvent, type: 'layer' | 'shape', id: string, index: number) => {
    e.dataTransfer.setData('type', type);
    e.dataTransfer.setData('id', id);
    e.dataTransfer.setData('index', index.toString());
  };

  const handleLayerDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    if (type !== 'layer') return;

    const fromIndex = parseInt(e.dataTransfer.getData('index'));
    if (fromIndex !== targetIndex) {
      reorderLayers(fromIndex, targetIndex);
    }
  };

  const handleShapeDrop = (e: React.DragEvent, layerId: string, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('type');
    if (type !== 'shape') return;

    const fromIndex = parseInt(e.dataTransfer.getData('index'));
    if (fromIndex !== targetIndex) {
      reorderShapeInLayer(layerId, fromIndex, targetIndex);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span>Layers</span>
        <button
          className={styles.iconButton}
          onClick={() => addLayer()}
          title="Add Layer"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className={styles.layersList}>
        {[...layers].reverse().map((layer, reversedIndex) => {
          const index = layers.length - 1 - reversedIndex;
          const layerShapes = layer.shapeIds.map((id) => shapes[id]).filter(Boolean);

          return (
            <div
              key={layer.id}
              className={`${styles.layerItem} ${activeLayerId === layer.id ? styles.activeLayer : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, 'layer', layer.id, index)}
              onDrop={(e) => handleLayerDrop(e, index)}
              onDragOver={handleDragOver}
              onClick={() => setActiveLayer(layer.id)}
            >
              <div className={styles.layerHeader}>
                <button
                  className={styles.iconButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { visible: !layer.visible });
                  }}
                  title={layer.visible ? 'Hide' : 'Show'}
                >
                  {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  className={styles.iconButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { locked: !layer.locked });
                  }}
                  title={layer.locked ? 'Unlock' : 'Lock'}
                >
                  {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                <span className={styles.layerName}>{layer.name}</span>
                <button
                  className={styles.iconButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(layer.id);
                  }}
                  disabled={layers.length <= 1}
                  title="Delete Layer"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className={styles.shapesList}>
                {[...layerShapes].reverse().map((shape, reversedShapeIndex) => {
                  const shapeIndex = layerShapes.length - 1 - reversedShapeIndex;
                  const isSelected = selectedIds.includes(shape.id);

                  return (
                    <div
                      key={shape.id}
                      className={`${styles.shapeItem} ${isSelected ? styles.selectedShape : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'shape', shape.id, shapeIndex)}
                      onDrop={(e) => handleShapeDrop(e, layer.id, shapeIndex)}
                      onDragOver={handleDragOver}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.shiftKey || e.metaKey || e.ctrlKey) {
                          const newSelection = isSelected
                            ? selectedIds.filter((id) => id !== shape.id)
                            : [...selectedIds, shape.id];
                          selectMultiple(newSelection);
                        } else {
                          selectMultiple([shape.id]);
                        }
                      }}
                    >
                      <div
                        className={styles.shapePreview}
                        style={{
                          backgroundColor: 'fill' in shape ? shape.fill : 'transparent',
                          borderColor: 'stroke' in shape ? shape.stroke : 'transparent',
                        }}
                      />
                      <span className={styles.shapeName}>{shape.name}</span>
                      <button
                        className={styles.iconButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          useCanvasStore.getState().updateShape(shape.id, {
                            visible: !shape.visible,
                          });
                        }}
                        title={shape.visible ? 'Hide' : 'Show'}
                      >
                        {shape.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
