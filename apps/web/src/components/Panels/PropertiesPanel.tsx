import { useCanvasStore, useSelectionStore } from '@/store';
import type { Shape } from '@editor-app/shared';
import styles from './Panels.module.css';

export function PropertiesPanel() {
  const { shapes, updateShape } = useCanvasStore();
  const { selectedIds } = useSelectionStore();

  if (selectedIds.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>Properties</div>
        <div className={styles.emptyState}>
          Select a shape to edit its properties
        </div>
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>Properties</div>
        <div className={styles.emptyState}>
          {selectedIds.length} shapes selected
        </div>
      </div>
    );
  }

  const shape = shapes[selectedIds[0]];
  if (!shape) return null;

  const handleChange = (field: keyof Shape, value: number | string | boolean) => {
    updateShape(shape.id, { [field]: value } as Partial<Shape>);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>Properties</div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Transform</div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>X</label>
            <input
              type="number"
              value={Math.round(shape.x)}
              onChange={(e) => handleChange('x', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className={styles.field}>
            <label>Y</label>
            <input
              type="number"
              value={Math.round(shape.y)}
              onChange={(e) => handleChange('y', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {'width' in shape && 'height' in shape && (
          <div className={styles.row}>
            <div className={styles.field}>
              <label>W</label>
              <input
                type="number"
                value={Math.round(shape.width)}
                onChange={(e) =>
                  updateShape(shape.id, { width: parseFloat(e.target.value) || 1 })
                }
              />
            </div>
            <div className={styles.field}>
              <label>H</label>
              <input
                type="number"
                value={Math.round(shape.height)}
                onChange={(e) =>
                  updateShape(shape.id, { height: parseFloat(e.target.value) || 1 })
                }
              />
            </div>
          </div>
        )}

        {'radiusX' in shape && 'radiusY' in shape && (
          <div className={styles.row}>
            <div className={styles.field}>
              <label>RX</label>
              <input
                type="number"
                value={Math.round(shape.radiusX)}
                onChange={(e) =>
                  updateShape(shape.id, { radiusX: parseFloat(e.target.value) || 1 })
                }
              />
            </div>
            <div className={styles.field}>
              <label>RY</label>
              <input
                type="number"
                value={Math.round(shape.radiusY)}
                onChange={(e) =>
                  updateShape(shape.id, { radiusY: parseFloat(e.target.value) || 1 })
                }
              />
            </div>
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Rotation</label>
            <input
              type="number"
              value={Math.round(shape.rotation)}
              onChange={(e) => handleChange('rotation', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {'fill' in shape && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Fill</div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Color</label>
              <input
                type="color"
                value={shape.fill}
                onChange={(e) =>
                  updateShape(shape.id, { fill: e.target.value })
                }
              />
              <input
                type="text"
                value={shape.fill}
                onChange={(e) =>
                  updateShape(shape.id, { fill: e.target.value })
                }
                className={styles.hexInput}
              />
            </div>
          </div>
        </div>
      )}

      {'stroke' in shape && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Stroke</div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Color</label>
              <input
                type="color"
                value={shape.stroke}
                onChange={(e) =>
                  updateShape(shape.id, { stroke: e.target.value })
                }
              />
              <input
                type="text"
                value={shape.stroke}
                onChange={(e) =>
                  updateShape(shape.id, { stroke: e.target.value })
                }
                className={styles.hexInput}
              />
            </div>
          </div>
          {'strokeWidth' in shape && (
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Width</label>
                <input
                  type="number"
                  min="0"
                  value={shape.strokeWidth}
                  onChange={(e) =>
                    updateShape(shape.id, { strokeWidth: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      {shape.type === 'text' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Text</div>
          <div className={styles.row}>
            <div className={styles.field} style={{ flex: 1 }}>
              <label>Content</label>
              <textarea
                value={shape.text}
                onChange={(e) =>
                  updateShape(shape.id, { text: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Size</label>
              <input
                type="number"
                min="1"
                value={shape.fontSize}
                onChange={(e) =>
                  updateShape(shape.id, { fontSize: parseFloat(e.target.value) || 12 })
                }
              />
            </div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Appearance</div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={shape.opacity}
              onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
            />
            <span>{Math.round(shape.opacity * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
