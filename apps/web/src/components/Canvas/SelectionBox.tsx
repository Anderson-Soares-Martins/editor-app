import { Rect } from 'react-konva';

interface SelectionBoxProps {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function SelectionBox({ box }: SelectionBoxProps) {
  return (
    <Rect
      x={box.x}
      y={box.y}
      width={box.width}
      height={box.height}
      fill="rgba(74, 158, 255, 0.1)"
      stroke="#4a9eff"
      strokeWidth={1}
      dash={[4, 4]}
    />
  );
}
