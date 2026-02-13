import { useEffect, useRef, useCallback, useState } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore } from '@/store';
import type { Shape } from '@editor-app/shared';

interface SelectionTransformerProps {
  selectedShapes: Shape[];
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function SelectionTransformer({
  selectedShapes,
  stageRef,
}: SelectionTransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const { updateShape } = useCanvasStore();
  const [shiftHeld, setShiftHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const nodes: Konva.Node[] = [];

    selectedShapes.forEach((shape) => {
      const node = stage.findOne(`#${shape.id}`);
      if (node) {
        nodes.push(node);
      }
    });

    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedShapes, stageRef]);

  const handleTransformEnd = useCallback(() => {
    if (!stageRef.current) return;

    selectedShapes.forEach((shape) => {
      const node = stageRef.current?.findOne(`#${shape.id}`);
      if (!node) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      let updates: Partial<Shape> = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      if (shape.type === 'rectangle' || shape.type === 'text' || shape.type === 'image') {
        updates = {
          ...updates,
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          scaleX: 1,
          scaleY: 1,
        };
        node.scaleX(1);
        node.scaleY(1);
      } else if (shape.type === 'circle') {
        updates = {
          ...updates,
          radiusX: Math.max(5, (node as Konva.Ellipse).radiusX() * scaleX),
          radiusY: Math.max(5, (node as Konva.Ellipse).radiusY() * scaleY),
          scaleX: 1,
          scaleY: 1,
        };
        node.scaleX(1);
        node.scaleY(1);
      } else {
        updates = {
          ...updates,
          scaleX,
          scaleY,
        };
      }

      updateShape(shape.id, updates);
    });
  }, [selectedShapes, stageRef, updateShape]);

  if (selectedShapes.length === 0) return null;

  return (
    <Transformer
      ref={transformerRef}
      keepRatio={shiftHeld}
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 5 || newBox.height < 5) {
          return oldBox;
        }
        return newBox;
      }}
      onTransformEnd={handleTransformEnd}
      anchorSize={8}
      anchorCornerRadius={2}
      borderStroke="#4a9eff"
      anchorStroke="#4a9eff"
      anchorFill="#ffffff"
      rotateEnabled={true}
      enabledAnchors={[
        'top-left',
        'top-center',
        'top-right',
        'middle-left',
        'middle-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ]}
    />
  );
}
