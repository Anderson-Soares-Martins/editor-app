import { useRef, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore, useSelectionStore, useToolStore } from '@/store';
import { snapPoint } from '@/utils/snap';
import { ShapeRenderer } from '../Shapes/ShapeRenderer';
import { SelectionTransformer } from './SelectionTransformer';
import { SelectionBox } from './SelectionBox';
import { PixelGrid } from './PixelGrid';
import { UserCursors } from '../Collaboration/UserCursors';
import { useShapeCreation } from '@/hooks/useShapeCreation';
import { useCanvas } from '@/hooks/useCanvas';
import type { Shape, TextShape as TextShapeType } from '@editor-app/shared';
import styles from './Canvas.module.css';

interface CanvasProps {
  onCursorMove?: (x: number, y: number) => void;
}

export function Canvas({ onCursorMove }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const rotationJustEndedRef = useRef(false);
  const [editingText, setEditingText] = useState<{
    shapeId: string;
    rect: { x: number; y: number; width: number; height: number };
    value: string;
  } | null>(null);
  const editingInputRef = useRef<HTMLTextAreaElement>(null);

  const { shapes, layers, viewport, updateShape } = useCanvasStore();
  const { selectedIds, clearSelection, selectionBox, selectMultiple } = useSelectionStore();
  const { activeTool, snapToGrid } = useToolStore();

  const {
    handleMouseDown: handleCreationMouseDown,
    handleMouseMove: handleCreationMouseMove,
    handleMouseUp: handleCreationMouseUp,
    isDrawing,
    previewShape,
  } = useShapeCreation(stageRef);

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDragStart,
    handleDragEnd,
    isPanning,
    screenToCanvas,
  } = useCanvas(stageRef);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getVisibleShapes = useCallback(() => {
    const visibleShapes: Shape[] = [];

    layers.forEach((layer) => {
      if (!layer.visible) return;
      layer.shapeIds.forEach((shapeId) => {
        const shape = shapes[shapeId];
        if (shape && shape.visible) {
          visibleShapes.push(shape);
        }
      });
    });

    return visibleShapes;
  }, [shapes, layers]);

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (rotationJustEndedRef.current) {
        rotationJustEndedRef.current = false;
        return;
      }
      if (e.target === e.target.getStage()) {
        clearSelection();
      }
    },
    [clearSelection]
  );

  const handleShapeClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, shapeId: string) => {
      if (activeTool !== 'select') return;

      e.cancelBubble = true;
      const isMultiSelect = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;

      if (isMultiSelect) {
        const isSelected = selectedIds.includes(shapeId);
        if (isSelected) {
          selectMultiple(selectedIds.filter((id) => id !== shapeId));
        } else {
          selectMultiple([...selectedIds, shapeId]);
        }
      } else {
        selectMultiple([shapeId]);
      }
    },
    [activeTool, selectedIds, selectMultiple]
  );

  const handleShapeDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (snapToGrid && !e.evt.altKey) {
        const node = e.target;
        // Skip snap for rotated shapes
        if (node.rotation() % 360 !== 0) return;
        const snapped = snapPoint({ x: node.x(), y: node.y() });
        node.x(snapped.x);
        node.y(snapped.y);
      }
    },
    [snapToGrid]
  );

  const handleShapeDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, shapeId: string) => {
      let x = e.target.x();
      let y = e.target.y();
      if (snapToGrid && !e.evt.altKey && e.target.rotation() % 360 === 0) {
        const snapped = snapPoint({ x, y });
        x = snapped.x;
        y = snapped.y;
      }
      updateShape(shapeId, { x, y });
    },
    [updateShape, snapToGrid]
  );

  const handleTextDblClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      const node = e.target;
      const stage = stageRef.current;
      if (!stage || node.getClassName() !== 'Text') return;
      const shape = Object.values(shapes).find((s) => s.id === node.id()) as TextShapeType | undefined;
      if (!shape || shape.type !== 'text') return;
      const containerRect = stage.container().getBoundingClientRect();
      const nodeRect = node.getClientRect();
      const scale = stage.scaleX();
      const pos = stage.position();
      setEditingText({
        shapeId: shape.id,
        rect: {
          x: containerRect.left + pos.x + nodeRect.x * scale,
          y: containerRect.top + pos.y + nodeRect.y * scale,
          width: Math.max(80, nodeRect.width * scale),
          height: Math.max(24, nodeRect.height * scale),
        },
        value: shape.text,
      });
    },
    [shapes]
  );

  useEffect(() => {
    if (editingText) {
      editingInputRef.current?.focus();
    }
  }, [editingText]);

  const handleEditingTextCommit = useCallback(() => {
    if (!editingText) return;
    const value = editingInputRef.current?.value ?? editingText.value;
    updateShape(editingText.shapeId, { text: value });
    setEditingText(null);
  }, [editingText, updateShape]);

  const handleEditingTextKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleEditingTextCommit();
      }
      if (e.key === 'Escape') {
        setEditingText(null);
      }
    },
    [handleEditingTextCommit]
  );


  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== 'select' && activeTool !== 'pan') {
        handleCreationMouseDown(e);
      }
    },
    [activeTool, handleCreationMouseDown]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Track cursor position for collaboration
      if (onCursorMove) {
        const canvasPos = screenToCanvas(e.evt.clientX, e.evt.clientY);
        onCursorMove(canvasPos.x, canvasPos.y);
      }

      if (isDrawing) {
        handleCreationMouseMove(e);
      }
    },
    [isDrawing, handleCreationMouseMove, onCursorMove, screenToCanvas]
  );

  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isDrawing) {
        handleCreationMouseUp(e);
      }
    },
    [isDrawing, handleCreationMouseUp]
  );

  const visibleShapes = getVisibleShapes();
  const selectedShapes = visibleShapes.filter((shape) =>
    selectedIds.includes(shape.id)
  );

  const cursorStyle =
    activeTool === 'pan' || isPanning
      ? 'grab'
      : activeTool === 'select'
      ? 'default'
      : 'crosshair';

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ cursor: cursorStyle }}
    >
      {editingText &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: editingText.rect.x,
              top: editingText.rect.y,
              width: editingText.rect.width,
              height: editingText.rect.height,
              zIndex: 10000,
              padding: 2,
              boxSizing: 'border-box',
              background: 'white',
              border: '1px solid #4a9eff',
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <textarea
              ref={editingInputRef}
              value={editingText.value}
              onChange={(e) =>
                setEditingText((prev) =>
                  prev ? { ...prev, value: e.target.value } : null
                )
              }
              onBlur={handleEditingTextCommit}
              onKeyDown={handleEditingTextKeyDown}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: 14,
                fontFamily: 'Arial',
                padding: 4,
                boxSizing: 'border-box',
              }}
            />
          </div>,
          document.body
        )}
      <PixelGrid viewport={viewport} width={dimensions.width} height={dimensions.height} />
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        draggable={activeTool === 'pan'}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Layer>
          {visibleShapes.map((shape) => (
            <ShapeRenderer
              key={shape.id}
              shape={shape}
              isSelected={selectedIds.includes(shape.id)}
              onClick={(e) => handleShapeClick(e, shape.id)}
              onDragEnd={(e) => handleShapeDragEnd(e, shape.id)}
              onDragMove={handleShapeDragMove}
              onTextDblClick={handleTextDblClick}
            />
          ))}
          {previewShape && (
            <ShapeRenderer
              shape={previewShape}
              isSelected={false}
              onClick={() => {}}
              onDragEnd={() => {}}
            />
          )}
        </Layer>
        <Layer>
          <SelectionTransformer
            selectedShapes={selectedShapes}
            stageRef={stageRef}
            onRotationEnd={() => {
              rotationJustEndedRef.current = true;
            }}
          />
          {selectionBox && <SelectionBox box={selectionBox} />}
          <UserCursors />
        </Layer>
      </Stage>
    </div>
  );
}
