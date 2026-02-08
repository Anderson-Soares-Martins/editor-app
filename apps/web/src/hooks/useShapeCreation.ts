import { useState, useCallback, useRef } from 'react';
import type Konva from 'konva';
import { useCanvasStore, useToolStore, useSelectionStore, useHistoryStore } from '@/store';
import type { Shape, RectangleShape, CircleShape, LineShape, TextShape } from '@editor-app/shared';

export function useShapeCreation(stageRef: React.RefObject<Konva.Stage | null>) {
  const { shapes, layers, addShape } = useCanvasStore();
  const { activeTool, fillColor, strokeColor, strokeWidth, fontSize, fontFamily } = useToolStore();
  const { selectMultiple } = useSelectionStore();
  const { pushState } = useHistoryStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [previewShape, setPreviewShape] = useState<Shape | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const getPointerPosition = useCallback((): { x: number; y: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;

    const pos = stage.getPointerPosition();
    if (!pos) return null;

    const scale = stage.scaleX();
    const stagePos = stage.position();

    return {
      x: (pos.x - stagePos.x) / scale,
      y: (pos.y - stagePos.y) / scale,
    };
  }, [stageRef]);

  const getShapeCount = useCallback((type: string) => {
    return Object.values(shapes).filter((s) => s.type === type).length + 1;
  }, [shapes]);

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === 'select' || activeTool === 'pan') return;
      if (e.target !== e.target.getStage()) return;

      const pos = getPointerPosition();
      if (!pos) return;

      startPosRef.current = pos;
      setIsDrawing(true);

      // Save state for undo
      pushState(shapes, layers);

      const baseShape = {
        x: pos.x,
        y: pos.y,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        locked: false,
        layerId: '',
      };

      let shape: Shape | null = null;

      switch (activeTool) {
        case 'rectangle':
          shape = {
            ...baseShape,
            id: 'preview',
            type: 'rectangle',
            name: `Rectangle ${getShapeCount('rectangle')}`,
            width: 0,
            height: 0,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth,
            cornerRadius: 0,
          } as RectangleShape;
          break;

        case 'circle':
          shape = {
            ...baseShape,
            id: 'preview',
            type: 'circle',
            name: `Circle ${getShapeCount('circle')}`,
            radiusX: 0,
            radiusY: 0,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth,
          } as CircleShape;
          break;

        case 'line':
          shape = {
            ...baseShape,
            id: 'preview',
            type: 'line',
            name: `Line ${getShapeCount('line')}`,
            points: [0, 0, 0, 0],
            stroke: strokeColor,
            strokeWidth,
            lineCap: 'round',
            lineJoin: 'round',
          } as LineShape;
          break;

        case 'text':
          const textShape: Omit<TextShape, 'id'> = {
            ...baseShape,
            type: 'text',
            name: `Text ${getShapeCount('text')}`,
            text: 'Text',
            fontSize,
            fontFamily,
            fontStyle: 'normal',
            fill: fillColor,
            align: 'left',
            width: 200,
            height: fontSize * 1.5,
          };
          const newId = addShape(textShape);
          selectMultiple([newId]);
          setIsDrawing(false);
          return;

        case 'image':
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                const imageShape = {
                  ...baseShape,
                  type: 'image' as const,
                  name: `Image ${getShapeCount('image')}`,
                  src: event.target?.result as string,
                  width: img.width,
                  height: img.height,
                };
                const newId = addShape(imageShape);
                selectMultiple([newId]);
              };
              img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
          };
          input.click();
          setIsDrawing(false);
          return;
      }

      setPreviewShape(shape);
    },
    [
      activeTool,
      getPointerPosition,
      pushState,
      shapes,
      layers,
      fillColor,
      strokeColor,
      strokeWidth,
      fontSize,
      fontFamily,
      addShape,
      selectMultiple,
      getShapeCount,
    ]
  );

  const handleMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawing || !startPosRef.current || !previewShape) return;

      const pos = getPointerPosition();
      if (!pos) return;

      const startPos = startPosRef.current;

      let updatedShape: Shape | null = null;

      switch (previewShape.type) {
        case 'rectangle':
          const width = pos.x - startPos.x;
          const height = pos.y - startPos.y;
          updatedShape = {
            ...previewShape,
            x: width < 0 ? pos.x : startPos.x,
            y: height < 0 ? pos.y : startPos.y,
            width: Math.abs(width),
            height: Math.abs(height),
          } as RectangleShape;
          break;

        case 'circle':
          const radiusX = Math.abs(pos.x - startPos.x) / 2;
          const radiusY = Math.abs(pos.y - startPos.y) / 2;
          const centerX = Math.min(startPos.x, pos.x) + radiusX;
          const centerY = Math.min(startPos.y, pos.y) + radiusY;
          updatedShape = {
            ...previewShape,
            x: centerX,
            y: centerY,
            radiusX,
            radiusY,
          } as CircleShape;
          break;

        case 'line':
          updatedShape = {
            ...previewShape,
            points: [0, 0, pos.x - startPos.x, pos.y - startPos.y],
          } as LineShape;
          break;
      }

      if (updatedShape) {
        setPreviewShape(updatedShape);
      }
    },
    [isDrawing, previewShape, getPointerPosition]
  );

  const handleMouseUp = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawing || !previewShape) {
        setIsDrawing(false);
        setPreviewShape(null);
        startPosRef.current = null;
        return;
      }

      let isValidShape = false;

      switch (previewShape.type) {
        case 'rectangle':
          isValidShape = previewShape.width > 5 && previewShape.height > 5;
          break;
        case 'circle':
          isValidShape = previewShape.radiusX > 5 && previewShape.radiusY > 5;
          break;
        case 'line':
          const [, , dx, dy] = previewShape.points;
          isValidShape = Math.abs(dx) > 5 || Math.abs(dy) > 5;
          break;
      }

      if (isValidShape) {
        const { id: _, ...shapeWithoutId } = previewShape;
        const newId = addShape(shapeWithoutId);
        selectMultiple([newId]);
      }

      setIsDrawing(false);
      setPreviewShape(null);
      startPosRef.current = null;
    },
    [isDrawing, previewShape, addShape, selectMultiple]
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDrawing,
    previewShape,
  };
}
