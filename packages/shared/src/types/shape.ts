export type ShapeType = 'rectangle' | 'circle' | 'line' | 'text' | 'image';

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  name: string;
  layerId: string;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  radiusX: number;
  radiusY: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface LineShape extends BaseShape {
  type: 'line';
  points: number[];
  stroke: string;
  strokeWidth: number;
  lineCap: 'butt' | 'round' | 'square';
  lineJoin: 'miter' | 'round' | 'bevel';
}

export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: string;
  fill: string;
  align: 'left' | 'center' | 'right';
  width: number;
  height: number;
}

export interface ImageShape extends BaseShape {
  type: 'image';
  src: string;
  width: number;
  height: number;
}

export type Shape = RectangleShape | CircleShape | LineShape | TextShape | ImageShape;

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  shapeIds: string[];
}

export interface CanvasState {
  shapes: Record<string, Shape>;
  layers: Layer[];
  activeLayerId: string | null;
}

export type Tool =
  | 'select'
  | 'pan'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'text'
  | 'image';

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface CollaboratorCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export interface HistoryEntry {
  shapes: Record<string, Shape>;
  layers: Layer[];
  timestamp: number;
}
