import { useEffect, useState } from 'react';
import { Image } from 'react-konva';
import type Konva from 'konva';
import type { ImageShape as ImageShapeType } from '@editor-app/shared';

interface ImageShapeProps {
  shape: ImageShapeType;
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

export function ImageShape({
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
}: ImageShapeProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = shape.src;
    img.onload = () => setImage(img);
  }, [shape.src]);

  if (!image) return null;

  return (
    <Image
      id={id}
      x={x}
      y={y}
      image={image}
      width={shape.width}
      height={shape.height}
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
