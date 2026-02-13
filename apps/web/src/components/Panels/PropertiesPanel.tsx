import { useCallback, useMemo } from 'react';
import { Sliders, Move, Palette, PenTool, Type as TypeIcon, Eye } from 'lucide-react';
import { useCanvasStore, useSelectionStore } from '@/store';
import type { Shape } from '@editor-app/shared';
import styles from './Panels.module.css';

// Helper to get common properties from multiple shapes
function getCommonValue<T>(shapes: Shape[], getter: (shape: Shape) => T): T | 'mixed' {
  if (shapes.length === 0) return 'mixed';
  const firstValue = getter(shapes[0]);
  const allSame = shapes.every((shape) => getter(shape) === firstValue);
  return allSame ? firstValue : 'mixed';
}

export function PropertiesPanel() {
  const { shapes, updateShape } = useCanvasStore();
  const { selectedIds } = useSelectionStore();

  const selectedShapes = useMemo(
    () => selectedIds.map((id) => shapes[id]).filter(Boolean),
    [selectedIds, shapes]
  );

  const handleBulkUpdate = useCallback(
    (updates: Partial<Shape>) => {
      selectedIds.forEach((id) => {
        updateShape(id, updates);
      });
    },
    [selectedIds, updateShape]
  );

  if (selectedIds.length === 0) {
    return (
      <div className={styles.panel} role="region" aria-label="Properties panel">
        <div className={styles.header}>Properties</div>
        <div className={styles.emptyState}>
          <Sliders size={32} />
          <span>Select a shape to edit its properties</span>
        </div>
      </div>
    );
  }

  // For single selection, use the first shape
  const shape = selectedShapes[0];
  const isMultiSelect = selectedIds.length > 1;

  if (!shape) return null;

  const handleChange = (field: keyof Shape, value: number | string | boolean) => {
    if (isMultiSelect) {
      handleBulkUpdate({ [field]: value } as Partial<Shape>);
    } else {
      updateShape(shape.id, { [field]: value } as Partial<Shape>);
    }
  };

  // Get display values for multi-select
  const xValue = isMultiSelect
    ? getCommonValue(selectedShapes, (s) => Math.round(s.x))
    : Math.round(shape.x);
  const yValue = isMultiSelect
    ? getCommonValue(selectedShapes, (s) => Math.round(s.y))
    : Math.round(shape.y);
  const rotationValue = isMultiSelect
    ? getCommonValue(selectedShapes, (s) => Math.round(s.rotation))
    : Math.round(shape.rotation);
  const opacityValue = isMultiSelect
    ? getCommonValue(selectedShapes, (s) => s.opacity)
    : shape.opacity;

  return (
    <div className={styles.panel} role="region" aria-label="Properties panel">
      <div className={styles.header}>
        Properties
        {isMultiSelect && (
          <span style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            fontWeight: 400
          }}>
            {selectedIds.length} selected
          </span>
        )}
      </div>

      {/* Transform Section */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <Move size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          Transform
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="prop-x">X</label>
            <input
              id="prop-x"
              type="number"
              value={xValue === 'mixed' ? '' : xValue}
              placeholder={xValue === 'mixed' ? 'Mixed' : undefined}
              onChange={(e) => handleChange('x', parseFloat(e.target.value) || 0)}
              aria-label="X position"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="prop-y">Y</label>
            <input
              id="prop-y"
              type="number"
              value={yValue === 'mixed' ? '' : yValue}
              placeholder={yValue === 'mixed' ? 'Mixed' : undefined}
              onChange={(e) => handleChange('y', parseFloat(e.target.value) || 0)}
              aria-label="Y position"
            />
          </div>
        </div>

        {!isMultiSelect && 'width' in shape && 'height' in shape && (
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="prop-w">W</label>
              <input
                id="prop-w"
                type="number"
                value={Math.round(shape.width)}
                onChange={(e) =>
                  updateShape(shape.id, { width: parseFloat(e.target.value) || 1 })
                }
                aria-label="Width"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="prop-h">H</label>
              <input
                id="prop-h"
                type="number"
                value={Math.round(shape.height)}
                onChange={(e) =>
                  updateShape(shape.id, { height: parseFloat(e.target.value) || 1 })
                }
                aria-label="Height"
              />
            </div>
          </div>
        )}

        {!isMultiSelect && 'radiusX' in shape && 'radiusY' in shape && (
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="prop-rx">RX</label>
              <input
                id="prop-rx"
                type="number"
                value={Math.round(shape.radiusX)}
                onChange={(e) =>
                  updateShape(shape.id, { radiusX: parseFloat(e.target.value) || 1 })
                }
                aria-label="Radius X"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="prop-ry">RY</label>
              <input
                id="prop-ry"
                type="number"
                value={Math.round(shape.radiusY)}
                onChange={(e) =>
                  updateShape(shape.id, { radiusY: parseFloat(e.target.value) || 1 })
                }
                aria-label="Radius Y"
              />
            </div>
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="prop-rotation">°</label>
            <input
              id="prop-rotation"
              type="number"
              value={rotationValue === 'mixed' ? '' : rotationValue}
              placeholder={rotationValue === 'mixed' ? 'Mixed' : undefined}
              onChange={(e) => handleChange('rotation', parseFloat(e.target.value) || 0)}
              aria-label="Rotation in degrees"
            />
          </div>
        </div>
      </div>

      {/* Fill Section */}
      {'fill' in shape && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Palette size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Fill
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <input
                type="color"
                value={shape.fill}
                onChange={(e) => {
                  if (isMultiSelect) {
                    handleBulkUpdate({ fill: e.target.value });
                  } else {
                    updateShape(shape.id, { fill: e.target.value });
                  }
                }}
                aria-label="Fill color"
              />
              <input
                type="text"
                value={shape.fill}
                onChange={(e) => {
                  if (isMultiSelect) {
                    handleBulkUpdate({ fill: e.target.value });
                  } else {
                    updateShape(shape.id, { fill: e.target.value });
                  }
                }}
                className={styles.hexInput}
                aria-label="Fill color hex value"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stroke Section */}
      {'stroke' in shape && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <PenTool size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Stroke
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <input
                type="color"
                value={shape.stroke}
                onChange={(e) => {
                  if (isMultiSelect) {
                    handleBulkUpdate({ stroke: e.target.value });
                  } else {
                    updateShape(shape.id, { stroke: e.target.value });
                  }
                }}
                aria-label="Stroke color"
              />
              <input
                type="text"
                value={shape.stroke}
                onChange={(e) => {
                  if (isMultiSelect) {
                    handleBulkUpdate({ stroke: e.target.value });
                  } else {
                    updateShape(shape.id, { stroke: e.target.value });
                  }
                }}
                className={styles.hexInput}
                aria-label="Stroke color hex value"
              />
            </div>
          </div>
          {'strokeWidth' in shape && (
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="prop-stroke-width">Width</label>
                <input
                  id="prop-stroke-width"
                  type="number"
                  min="0"
                  step="0.5"
                  value={shape.strokeWidth}
                  onChange={(e) => {
                    if (isMultiSelect) {
                      handleBulkUpdate({ strokeWidth: parseFloat(e.target.value) || 0 });
                    } else {
                      updateShape(shape.id, { strokeWidth: parseFloat(e.target.value) || 0 });
                    }
                  }}
                  aria-label="Stroke width"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Section */}
      {!isMultiSelect && shape.type === 'text' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <TypeIcon size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Text
          </div>
          <div className={styles.row}>
            <div className={styles.field} style={{ flex: 1 }}>
              <textarea
                value={shape.text}
                onChange={(e) =>
                  updateShape(shape.id, { text: e.target.value })
                }
                rows={3}
                aria-label="Text content"
                placeholder="Enter text..."
              />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="prop-font-size">Size</label>
              <input
                id="prop-font-size"
                type="number"
                min="1"
                value={shape.fontSize}
                onChange={(e) =>
                  updateShape(shape.id, { fontSize: parseFloat(e.target.value) || 12 })
                }
                aria-label="Font size"
              />
            </div>
          </div>
        </div>
      )}

      {/* Appearance Section */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <Eye size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          Appearance
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="prop-opacity">Opacity</label>
            <input
              id="prop-opacity"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={opacityValue === 'mixed' ? 1 : opacityValue}
              onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
              aria-label="Opacity"
            />
            <span>
              {opacityValue === 'mixed' ? '—' : `${Math.round((opacityValue as number) * 100)}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
