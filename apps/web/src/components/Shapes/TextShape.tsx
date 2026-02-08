import { Text } from 'react-konva';
import type Konva from 'konva';
import type { TextShape as TextShapeType } from '@editor-app/shared';

interface TextShapeProps {
  shape: TextShapeType;
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

export function TextShape({
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
}: TextShapeProps) {
  return (
    <Text
      id={id}
      x={x}
      y={y}
      text={shape.text}
      fontSize={shape.fontSize}
      fontFamily={shape.fontFamily}
      fontStyle={shape.fontStyle}
      fill={shape.fill}
      align={shape.align}
      width={shape.width}
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
