import { Ellipse } from 'react-konva';
import type Konva from 'konva';
import type { CircleShape as CircleShapeType } from '@editor-app/shared';

interface CircleShapeProps {
  shape: CircleShapeType;
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

export function CircleShape({
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
}: CircleShapeProps) {
  return (
    <Ellipse
      id={id}
      x={x}
      y={y}
      radiusX={shape.radiusX}
      radiusY={shape.radiusY}
      fill={shape.fill}
      stroke={shape.stroke}
      strokeWidth={shape.strokeWidth}
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
