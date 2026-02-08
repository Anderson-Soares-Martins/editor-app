import { Line } from 'react-konva';
import type Konva from 'konva';
import type { LineShape as LineShapeType } from '@editor-app/shared';

interface LineShapeProps {
  shape: LineShapeType;
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

export function LineShape({
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
}: LineShapeProps) {
  return (
    <Line
      id={id}
      x={x}
      y={y}
      points={shape.points}
      stroke={shape.stroke}
      strokeWidth={shape.strokeWidth}
      lineCap={shape.lineCap}
      lineJoin={shape.lineJoin}
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      opacity={opacity}
      draggable={draggable}
      onClick={onClick}
      onTap={onTap}
      onDragEnd={onDragEnd}
      hitStrokeWidth={Math.max(shape.strokeWidth, 10)}
    />
  );
}
