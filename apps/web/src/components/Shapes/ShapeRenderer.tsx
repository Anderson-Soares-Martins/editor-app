import type Konva from 'konva';
import type { Shape } from '@editor-app/shared';
import { RectangleShape } from './RectangleShape';
import { CircleShape } from './CircleShape';
import { LineShape } from './LineShape';
import { TextShape } from './TextShape';
import { ImageShape } from './ImageShape';

interface ShapeRendererProps {
  shape: Shape;
  isSelected: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTextDblClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

export function ShapeRenderer({
  shape,
  onClick,
  onDragEnd,
  onDragMove,
  onTextDblClick,
}: ShapeRendererProps) {
  const commonProps = {
    id: shape.id,
    x: shape.x,
    y: shape.y,
    rotation: shape.rotation,
    scaleX: shape.scaleX,
    scaleY: shape.scaleY,
    opacity: shape.opacity,
    draggable: !shape.locked,
    onClick,
    onTap: onClick,
    onDragEnd,
    onDragMove,
  };

  switch (shape.type) {
    case 'rectangle':
      return <RectangleShape shape={shape} {...commonProps} />;
    case 'circle':
      return <CircleShape shape={shape} {...commonProps} />;
    case 'line':
      return <LineShape shape={shape} {...commonProps} />;
    case 'text':
      return <TextShape shape={shape} {...commonProps} onDblClick={onTextDblClick} />;
    case 'image':
      return <ImageShape shape={shape} {...commonProps} />;
    default:
      return null;
  }
}
