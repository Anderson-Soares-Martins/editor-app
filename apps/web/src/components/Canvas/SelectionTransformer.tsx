import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Transformer, Rect, Group, Circle } from 'react-konva';
import type Konva from 'konva';
import type { Box } from 'konva/lib/shapes/Transformer';
import { useCanvasStore, useToolStore } from '@/store';
import type { Shape, LineShape as LineShapeType } from '@editor-app/shared';
import { snapRect, snapPoint } from '@/utils/snap';

// Seta semicírculo dupla (curved double arrow) — path from viewBox 0 0 800 272, center (400,136)
const ROTATE_ICON_PATH =
  'M131.766 106.605C287.16 -20.8875 512.827 -20.8591 668.226 106.636L678.447 115.022L684.834 103.444L721.848 36.3438L721.854 36.3311L721.862 36.3174C722.008 36.0519 722.334 35.8443 722.752 35.8906L722.805 35.8965C723.128 35.9308 723.496 36.1857 723.63 36.6162L788.959 258.97L788.961 258.977C789.069 259.344 788.943 259.64 788.791 259.788L788.685 259.893L788.581 259.999C788.444 260.14 788.122 260.303 787.662 260.174L565.36 194.812L565.353 194.811L565.225 194.763C564.937 194.63 564.725 194.351 564.688 193.999L564.684 193.971L564.681 193.942L564.677 193.823C564.681 193.702 564.713 193.573 564.78 193.444C564.871 193.27 565 193.144 565.139 193.068L565.151 193.062L565.163 193.056L618.291 163.747L633.072 155.593L619.643 145.364C490.26 46.8229 309.698 46.8227 180.318 145.364L166.886 155.595L181.672 163.748L234.828 193.057L234.879 193.084C235.193 193.255 235.349 193.596 235.314 193.89L235.308 193.944L235.302 193.999C235.259 194.401 234.989 194.706 234.638 194.809L234.622 194.812L12.3271 260.173C11.8893 260.297 11.5647 260.159 11.3809 259.972L11.3047 259.894L11.2266 259.817L11.1592 259.74C11.0145 259.551 10.9586 259.287 11.0332 259.038L11.0439 259.004L11.0537 258.97L76.3906 36.6143C76.5321 36.1554 76.892 35.9282 77.1885 35.8965L77.2148 35.8936L77.2402 35.8906C77.5962 35.8512 77.9129 36.0009 78.1006 36.2451L78.1729 36.3555L115.156 103.414L121.542 114.993L131.766 106.605Z';

function getRotateCursorDataUrl(degrees: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 800 272" fill="none"><g transform="rotate(${degrees} 400 136)"><path d="${ROTATE_ICON_PATH}" fill="black" stroke="white" stroke-width="22"/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 16 16, crosshair`;
}

// Ângulo base do ícone por canto (top-left, top-right, bottom-left, bottom-right); soma-se a rotação da peça
const ROTATE_BASE_ANGLES = [315, 45, 225, 135];

interface SelectionTransformerProps {
  selectedShapes: Shape[];
  stageRef: React.RefObject<Konva.Stage | null>;
  onRotationEnd?: () => void;
}

export function SelectionTransformer({
  selectedShapes,
  stageRef,
  onRotationEnd,
}: SelectionTransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const { updateShape, viewport } = useCanvasStore();
  const { snapToGrid } = useToolStore();
  const [shiftHeld, setShiftHeld] = useState(false);
  const altHeldRef = useRef(false);

  // Rotation tracking
  const isRotatingRef = useRef(false);
  const rotStartAngleRef = useRef(0);
  const centerRef = useRef({ x: 0, y: 0 });
  const initialRotationsRef = useRef<
    { id: string; rotation: number; x: number; y: number }[]
  >([]);
  const rotatingCornerRef = useRef(0);
  const shiftHeldRef = useRef(false);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const rotationCleanupRef = useRef<(() => void) | null>(null);
  // Durante o arraste, rotação ao vivo para as zonas e o cursor acompanharem
  const [liveRotation, setLiveRotation] = useState<number | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftHeld(true);
        shiftHeldRef.current = true;
      }
      if (e.key === 'Alt') altHeldRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftHeld(false);
        shiftHeldRef.current = false;
      }
      if (e.key === 'Alt') altHeldRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      rotationCleanupRef.current?.();
    };
  }, []);

  // Linhas não usam o Transformer; usam duas alças nas pontas
  const lineShapes = useMemo(
    () => selectedShapes.filter((s): s is LineShapeType => s.type === 'line'),
    [selectedShapes]
  );
  const nonLineShapes = useMemo(
    () => selectedShapes.filter((s) => s.type !== 'line'),
    [selectedShapes]
  );

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const nodes: Konva.Node[] = [];

    nonLineShapes.forEach((shape) => {
      const node = stage.findOne(`#${shape.id}`);
      if (node) {
        nodes.push(node);
      }
    });

    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [nonLineShapes, stageRef]);

  const handleTransformEnd = useCallback(() => {
    if (!stageRef.current) return;

    const shouldSnap = snapToGrid && !altHeldRef.current;

    selectedShapes.forEach((shape) => {
      const node = stageRef.current?.findOne(`#${shape.id}`);
      if (!node) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const isRotated = node.rotation() % 360 !== 0;

      let updates: Partial<Shape> = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      if (
        shape.type === 'rectangle' ||
        shape.type === 'text' ||
        shape.type === 'image'
      ) {
        let w = Math.max(5, node.width() * scaleX);
        let h = Math.max(5, node.height() * scaleY);
        let x = node.x();
        let y = node.y();

        if (shouldSnap && !isRotated) {
          const snapped = snapRect({ x, y, width: w, height: h });
          x = snapped.x;
          y = snapped.y;
          w = snapped.width;
          h = snapped.height;
        }

        updates = {
          ...updates,
          x,
          y,
          width: w,
          height: h,
          scaleX: 1,
          scaleY: 1,
        };
        node.scaleX(1);
        node.scaleY(1);
      } else if (shape.type === 'circle') {
        let rx = Math.max(5, (node as Konva.Ellipse).radiusX() * scaleX);
        let ry = Math.max(5, (node as Konva.Ellipse).radiusY() * scaleY);
        let x = node.x();
        let y = node.y();

        if (shouldSnap && !isRotated) {
          // Snap the bounding box of the ellipse
          const snapped = snapRect({
            x: x - rx,
            y: y - ry,
            width: rx * 2,
            height: ry * 2,
          });
          rx = snapped.width / 2;
          ry = snapped.height / 2;
          x = snapped.x + rx;
          y = snapped.y + ry;
        }

        updates = {
          ...updates,
          x,
          y,
          radiusX: rx,
          radiusY: ry,
          scaleX: 1,
          scaleY: 1,
        };
        node.scaleX(1);
        node.scaleY(1);
      } else {
        updates = { ...updates, scaleX, scaleY };
      }

      updateShape(shape.id, updates);
    });
  }, [selectedShapes, stageRef, updateShape, snapToGrid]);

  const snapBoundBox = useCallback(
    (oldBox: Box, newBox: Box) => {
      if (newBox.width < 5 || newBox.height < 5) {
        return oldBox;
      }

      if (!snapToGrid || altHeldRef.current) {
        return newBox;
      }

      // Convert screen-space box to world, snap edges, convert back
      const scale = viewport.scale;
      const left = (newBox.x - viewport.x) / scale;
      const top = (newBox.y - viewport.y) / scale;
      const right = left + newBox.width / scale;
      const bottom = top + newBox.height / scale;

      const sLeft = Math.round(left);
      const sTop = Math.round(top);
      const sRight = Math.round(right);
      const sBottom = Math.round(bottom);

      const sWidth = (sRight - sLeft) * scale;
      const sHeight = (sBottom - sTop) * scale;

      if (sWidth < 5 || sHeight < 5) return oldBox;

      return {
        x: sLeft * scale + viewport.x,
        y: sTop * scale + viewport.y,
        width: sWidth,
        height: sHeight,
        rotation: newBox.rotation,
      };
    },
    [snapToGrid, viewport]
  );

  const anchorStyleFunc = useCallback((anchor: Konva.Rect) => {
    const name = anchor.name();
    const isCorner =
      name.includes('top-left') ||
      name.includes('top-right') ||
      name.includes('bottom-left') ||
      name.includes('bottom-right');

    if (isCorner) return;

    const tr = transformerRef.current;
    if (!tr) return;

    const anchorPad = 8;
    const isHorizontal =
      name.includes('top-center') || name.includes('bottom-center');

    if (isHorizontal) {
      const w = Math.max(0, tr.width() - anchorPad * 2);
      anchor.width(w);
      anchor.height(8);
      anchor.offsetX(w / 2);
      anchor.offsetY(4);
    } else {
      const h = Math.max(0, tr.height() - anchorPad * 2);
      anchor.width(8);
      anchor.height(h);
      anchor.offsetX(4);
      anchor.offsetY(h / 2);
    }

    anchor.fill('transparent');
    anchor.stroke('transparent');
    anchor.hitStrokeWidth(10);
  }, []);

  // Compute rotation zone positions from shape data (apenas formas que usam transformer, não linhas)
  const rotZoneData = useMemo(() => {
    if (nonLineShapes.length === 0) return null;

    const zoneSize = 20 / viewport.scale;

    if (nonLineShapes.length === 1) {
      const shape = nonLineShapes[0];

      if (shape.type === 'circle') {
        const rx = shape.radiusX;
        const ry = shape.radiusY;
        return {
          groupX: shape.x,
          groupY: shape.y,
          rotation: shape.rotation || 0,
          corners: [
            { x: -rx - zoneSize, y: -ry - zoneSize },
            { x: rx, y: -ry - zoneSize },
            { x: -rx - zoneSize, y: ry },
            { x: rx, y: ry },
          ],
          zoneSize,
        };
      }

      const w =
        'width' in shape ? (shape as unknown as { width: number }).width : 100;
      const h =
        'height' in shape
          ? (shape as unknown as { height: number }).height
          : 100;
      return {
        groupX: shape.x,
        groupY: shape.y,
        rotation: shape.rotation || 0,
        corners: [
          { x: -zoneSize, y: -zoneSize },
          { x: w, y: -zoneSize },
          { x: -zoneSize, y: h },
          { x: w, y: h },
        ],
        zoneSize,
      };
    }

    // Multi-selection: axis-aligned bounding box
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    nonLineShapes.forEach((shape) => {
      if (shape.type === 'circle') {
        minX = Math.min(minX, shape.x - shape.radiusX);
        minY = Math.min(minY, shape.y - shape.radiusY);
        maxX = Math.max(maxX, shape.x + shape.radiusX);
        maxY = Math.max(maxY, shape.y + shape.radiusY);
      } else {
        const w =
          'width' in shape
            ? (shape as unknown as { width: number }).width
            : 100;
        const h =
          'height' in shape
            ? (shape as unknown as { height: number }).height
            : 100;
        minX = Math.min(minX, shape.x);
        minY = Math.min(minY, shape.y);
        maxX = Math.max(maxX, shape.x + w);
        maxY = Math.max(maxY, shape.y + h);
      }
    });

    return {
      groupX: minX,
      groupY: minY,
      rotation: 0,
      corners: [
        { x: -zoneSize, y: -zoneSize },
        { x: maxX - minX, y: -zoneSize },
        { x: -zoneSize, y: maxY - minY },
        { x: maxX - minX, y: maxY - minY },
      ],
      zoneSize,
    };
  }, [nonLineShapes, viewport.scale]);

  // Start rotation on mousedown in a rotation zone
  const handleRotateStart = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, cornerIndex: number) => {
      e.cancelBubble = true;
      const stage = stageRef.current;
      if (!stage) return;

      isRotatingRef.current = true;
      rotatingCornerRef.current = cornerIndex;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;
      const vp = viewportRef.current;
      const worldMX = (pointerPos.x - vp.x) / vp.scale;
      const worldMY = (pointerPos.y - vp.y) / vp.scale;

      // Compute rotation center and save initial states
      const initials: typeof initialRotationsRef.current = [];

      if (selectedShapes.length === 1) {
        const shape = selectedShapes[0];
        const node = stage.findOne(`#${shape.id}`);
        if (!node) return;

        initials.push({
          id: shape.id,
          rotation: node.rotation(),
          x: node.x(),
          y: node.y(),
        });

        if (shape.type === 'circle') {
          centerRef.current = { x: node.x(), y: node.y() };
        } else {
          const w = node.width() * node.scaleX();
          const h = node.height() * node.scaleY();
          const r = (node.rotation() * Math.PI) / 180;
          centerRef.current = {
            x: node.x() + (w / 2) * Math.cos(r) - (h / 2) * Math.sin(r),
            y: node.y() + (w / 2) * Math.sin(r) + (h / 2) * Math.cos(r),
          };
        }
      } else {
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        selectedShapes.forEach((shape) => {
          const node = stage.findOne(`#${shape.id}`);
          if (!node) return;
          initials.push({
            id: shape.id,
            rotation: node.rotation(),
            x: node.x(),
            y: node.y(),
          });

          if (shape.type === 'circle') {
            minX = Math.min(minX, shape.x - shape.radiusX);
            minY = Math.min(minY, shape.y - shape.radiusY);
            maxX = Math.max(maxX, shape.x + shape.radiusX);
            maxY = Math.max(maxY, shape.y + shape.radiusY);
          } else {
            const sw =
              'width' in shape
                ? (shape as unknown as { width: number }).width
                : 100;
            const sh =
              'height' in shape
                ? (shape as unknown as { height: number }).height
                : 100;
            minX = Math.min(minX, shape.x);
            minY = Math.min(minY, shape.y);
            maxX = Math.max(maxX, shape.x + sw);
            maxY = Math.max(maxY, shape.y + sh);
          }
        });
        centerRef.current = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
      }

      initialRotationsRef.current = initials;
      rotStartAngleRef.current = Math.atan2(
        worldMY - centerRef.current.y,
        worldMX - centerRef.current.x
      );

      const initialRotation =
        selectedShapes.length === 1 && initials[0]
          ? initials[0].rotation
          : 0;
      if (selectedShapes.length === 1) setLiveRotation(initialRotation);

      const cornerIdx = rotatingCornerRef.current;
      stage.container().style.cursor = getRotateCursorDataUrl(
        ROTATE_BASE_ANGLES[cornerIdx] + initialRotation
      );

      const onMouseMove = (ev: MouseEvent) => {
        if (!isRotatingRef.current) return;
        const stg = stageRef.current;
        if (!stg) return;

        const container = stg.container().getBoundingClientRect();
        const cvp = viewportRef.current;
        const mx = (ev.clientX - container.left - cvp.x) / cvp.scale;
        const my = (ev.clientY - container.top - cvp.y) / cvp.scale;

        const currentAngle = Math.atan2(
          my - centerRef.current.y,
          mx - centerRef.current.x
        );
        let deltaDeg =
          ((currentAngle - rotStartAngleRef.current) * 180) / Math.PI;

        if (shiftHeldRef.current) {
          deltaDeg = Math.round(deltaDeg / 15) * 15;
        }

        initialRotationsRef.current.forEach((initial) => {
          const node = stg.findOne(`#${initial.id}`);
          if (!node) return;

          node.rotation(initial.rotation + deltaDeg);

          // Rotate origin around center to keep visual center fixed
          const rad = (deltaDeg * Math.PI) / 180;
          const dx = initial.x - centerRef.current.x;
          const dy = initial.y - centerRef.current.y;
          node.x(centerRef.current.x + dx * Math.cos(rad) - dy * Math.sin(rad));
          node.y(centerRef.current.y + dx * Math.sin(rad) + dy * Math.cos(rad));
        });

        if (initialRotationsRef.current.length === 1) {
          const node = stg.findOne(`#${initialRotationsRef.current[0].id}`);
          if (node) {
            setLiveRotation(node.rotation());
            stg.container().style.cursor = getRotateCursorDataUrl(
              ROTATE_BASE_ANGLES[rotatingCornerRef.current] + node.rotation()
            );
          }
        }

        stg.batchDraw();
      };

      const onMouseUp = () => {
        isRotatingRef.current = false;
        rotationCleanupRef.current = null;
        setLiveRotation(null);
        onRotationEnd?.();

        const stg = stageRef.current;
        if (stg) stg.container().style.cursor = '';

        initialRotationsRef.current.forEach((initial) => {
          const node = stg?.findOne(`#${initial.id}`);
          if (!node) return;
          updateShape(initial.id, {
            rotation: node.rotation(),
            x: node.x(),
            y: node.y(),
          });
        });

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      rotationCleanupRef.current = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [selectedShapes, stageRef, updateShape, onRotationEnd]
  );

  const handleRotateZoneEnter = useCallback(
    (cornerIndex: number, shapeRotation: number) => {
      if (stageRef.current && !isRotatingRef.current) {
        const angle =
          ROTATE_BASE_ANGLES[cornerIndex] + (shapeRotation || 0);
        stageRef.current.container().style.cursor =
          getRotateCursorDataUrl(angle);
      }
    },
    [stageRef]
  );

  const handleRotateZoneLeave = useCallback(() => {
    if (stageRef.current && !isRotatingRef.current) {
      stageRef.current.container().style.cursor = '';
    }
  }, [stageRef]);

  const handleLineHandleDragMove = useCallback(
    (lineShape: LineShapeType, handleIndex: 0 | 1, x: number, y: number) => {
      const [, , dx, dy] = lineShape.points;
      if (snapToGrid && !altHeldRef.current) {
        const snapped = snapPoint({ x, y });
        x = snapped.x;
        y = snapped.y;
      }
      if (handleIndex === 0) {
        const endX = lineShape.x + dx;
        const endY = lineShape.y + dy;
        updateShape(lineShape.id, {
          x,
          y,
          points: [0, 0, endX - x, endY - y],
        });
      } else {
        updateShape(lineShape.id, {
          points: [0, 0, x - lineShape.x, y - lineShape.y],
        });
      }
    },
    [updateShape, snapToGrid]
  );

  const handleLineHandleDragEnd = useCallback(
    (lineShape: LineShapeType, handleIndex: 0 | 1, x: number, y: number) => {
      handleLineHandleDragMove(lineShape, handleIndex, x, y);
    },
    [handleLineHandleDragMove]
  );

  if (selectedShapes.length === 0) return null;

  const lineHandleSize = Math.max(8 / viewport.scale, 6);

  return (
    <>
      {lineShapes.map((lineShape) => {
        const [,, px, py] = lineShape.points;
        const x1 = lineShape.x;
        const y1 = lineShape.y;
        const x2 = lineShape.x + px;
        const y2 = lineShape.y + py;
        return (
          <Group key={lineShape.id}>
            <Circle
              x={x1}
              y={y1}
              radius={lineHandleSize}
              fill="#ffffff"
              stroke="#4a9eff"
              strokeWidth={2}
              draggable
              onDragMove={(e) => {
                const node = e.target;
                handleLineHandleDragMove(lineShape, 0, node.x(), node.y());
              }}
              onDragEnd={(e) => {
                const node = e.target;
                handleLineHandleDragEnd(lineShape, 0, node.x(), node.y());
              }}
              onMouseDown={(e) => e.cancelBubble = true}
            />
            <Circle
              x={x2}
              y={y2}
              radius={lineHandleSize}
              fill="#ffffff"
              stroke="#4a9eff"
              strokeWidth={2}
              draggable
              onDragMove={(e) => {
                const node = e.target;
                handleLineHandleDragMove(lineShape, 1, node.x(), node.y());
              }}
              onDragEnd={(e) => {
                const node = e.target;
                handleLineHandleDragEnd(lineShape, 1, node.x(), node.y());
              }}
              onMouseDown={(e) => e.cancelBubble = true}
            />
          </Group>
        );
      })}
      {rotZoneData && (
        <Group
          x={rotZoneData.groupX}
          y={rotZoneData.groupY}
          rotation={liveRotation ?? rotZoneData.rotation}
        >
          {rotZoneData.corners.map((corner, i) => (
            <Rect
              key={i}
              x={corner.x}
              y={corner.y}
              width={rotZoneData.zoneSize}
              height={rotZoneData.zoneSize}
              fill="transparent"
              onMouseEnter={() =>
                handleRotateZoneEnter(i, rotZoneData.rotation)
              }
              onMouseLeave={handleRotateZoneLeave}
              onMouseDown={(e) => handleRotateStart(e, i)}
            />
          ))}
        </Group>
      )}
      <Transformer
        ref={transformerRef}
        keepRatio={shiftHeld}
        boundBoxFunc={snapBoundBox}
        onTransformEnd={handleTransformEnd}
        anchorStyleFunc={anchorStyleFunc}
        anchorSize={8}
        anchorCornerRadius={2}
        borderStroke="#4a9eff"
        anchorStroke="#4a9eff"
        anchorFill="#ffffff"
        rotateEnabled={false}
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
    </>
  );
}
