import { Rect } from 'react-konva';
import type Konva from 'konva';
import type { RectangleShape as RectangleShapeType } from '@editor-app/shared';

interface RectangleShapeProps {
  shape: RectangleShapeType;
  id: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  draggable: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onTap: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export function RectangleShape({
  shape,
  id,
  x,
  y,
  rotation,
  scaleX,
  scaleY,
  opacity,
  draggable,
  onClick,
  onTap,
  onDragEnd,
}: RectangleShapeProps) {
  return (
    <Rect
      id={id}
      x={x}
      y={y}
      width={shape.width}
      height={shape.height}
      fill={shape.fill}
      stroke={shape.stroke}
      strokeWidth={shape.strokeWidth}
      cornerRadius={shape.cornerRadius}
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      opacity={opacity}
      draggable={draggable}
      onClick={onClick}
      onTap={onTap}
      onDragEnd={onDragEnd}
    />
  );
}
