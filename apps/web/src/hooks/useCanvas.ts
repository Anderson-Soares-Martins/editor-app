import { useCallback, useState, useRef, useEffect } from 'react';
import type Konva from 'konva';
import { useCanvasStore, useToolStore } from '@/store';

export function useCanvas(stageRef: React.RefObject<Konva.Stage | null>) {
  const { viewport, setViewport, zoomTo, panBy } = useCanvasStore();
  const { activeTool } = useToolStore();
  const [isPanning, setIsPanning] = useState(false);

  // Touch state for pinch-to-zoom
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const lastGestureScale = useRef<number>(1);

  // Setup wheel and gesture handlers directly on the container
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const container = stage.container();

    // Handle wheel events (includes trackpad pinch which sends ctrlKey)
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();

      // Pinch-to-zoom on trackpad sends wheel events with ctrlKey
      const isZoomGesture = e.ctrlKey;

      if (isZoomGesture) {
        // Get pointer position relative to stage
        const stageBox = container.getBoundingClientRect();
        const pointerX = e.clientX - stageBox.left;
        const pointerY = e.clientY - stageBox.top;

        const oldScale = viewport.scale;

        // deltaY is negative when zooming in (fingers apart), positive when zooming out
        const zoomIntensity = 0.01;
        const delta = -e.deltaY * zoomIntensity;
        const newScale = Math.max(0.1, Math.min(10, oldScale * (1 + delta)));

        zoomTo(newScale, pointerX, pointerY);
      } else {
        // Pan with two-finger scroll (no modifier)
        panBy(-e.deltaX, -e.deltaY);
      }
    };

    // Safari-specific gesture events for pinch-to-zoom
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
      lastGestureScale.current = viewport.scale;
    };

    const handleGestureChange = (e: Event) => {
      e.preventDefault();
      const gestureEvent = e as unknown as { scale: number; clientX: number; clientY: number };

      if (gestureEvent.scale) {
        const newScale = Math.max(0.1, Math.min(10, lastGestureScale.current * gestureEvent.scale));

        const stageBox = container.getBoundingClientRect();
        const zoomPointX = gestureEvent.clientX - stageBox.left;
        const zoomPointY = gestureEvent.clientY - stageBox.top;

        zoomTo(newScale, zoomPointX, zoomPointY);
      }
    };

    const handleGestureEnd = (e: Event) => {
      e.preventDefault();
    };

    // Prevent default touch behaviors
    const preventDefaultTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Add event listeners with passive: false to allow preventDefault
    container.addEventListener('wheel', handleWheelEvent, { passive: false });
    container.addEventListener('gesturestart', handleGestureStart);
    container.addEventListener('gesturechange', handleGestureChange);
    container.addEventListener('gestureend', handleGestureEnd);
    container.addEventListener('touchmove', preventDefaultTouch, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
      container.removeEventListener('gesturestart', handleGestureStart);
      container.removeEventListener('gesturechange', handleGestureChange);
      container.removeEventListener('gestureend', handleGestureEnd);
      container.removeEventListener('touchmove', preventDefaultTouch);
    };
  }, [stageRef, viewport.scale, zoomTo, panBy]);

  // Calculate distance between two touch points
  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getTouchCenter = (touches: TouchList): { x: number; y: number } => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      const touches = e.evt.touches;

      if (touches.length === 2) {
        // Start of pinch gesture
        e.evt.preventDefault();
        lastTouchDistance.current = getTouchDistance(touches);
        lastTouchCenter.current = getTouchCenter(touches);
      }
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      const touches = e.evt.touches;
      const stage = stageRef.current;

      if (!stage) return;

      if (touches.length === 2 && lastTouchDistance.current !== null) {
        // Pinch gesture in progress
        e.evt.preventDefault();

        const newDistance = getTouchDistance(touches);
        const newCenter = getTouchCenter(touches);

        // Calculate zoom
        const scale = newDistance / lastTouchDistance.current;
        const oldScale = viewport.scale;
        const newScale = Math.max(0.1, Math.min(10, oldScale * scale));

        // Get stage position for zoom center calculation
        const stageBox = stage.container().getBoundingClientRect();
        const zoomPointX = newCenter.x - stageBox.left;
        const zoomPointY = newCenter.y - stageBox.top;

        // Apply zoom centered on pinch point
        zoomTo(newScale, zoomPointX, zoomPointY);

        // Also pan if the center moved
        if (lastTouchCenter.current) {
          const dx = newCenter.x - lastTouchCenter.current.x;
          const dy = newCenter.y - lastTouchCenter.current.y;
          panBy(dx, dy);
        }

        lastTouchDistance.current = newDistance;
        lastTouchCenter.current = newCenter;
      }
    },
    [stageRef, viewport.scale, zoomTo, panBy]
  );

  const handleTouchEnd = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length < 2) {
        // End of pinch gesture
        lastTouchDistance.current = null;
        lastTouchCenter.current = null;
      }
    },
    []
  );

  const handleDragStart = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (e.target !== e.target.getStage()) return;
      if (activeTool === 'pan') {
        setIsPanning(true);
      }
    },
    [activeTool]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (e.target !== e.target.getStage()) return;
      if (activeTool === 'pan') {
        setIsPanning(false);
        setViewport({
          x: e.target.x(),
          y: e.target.y(),
        });
      }
    },
    [activeTool, setViewport]
  );

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      const stage = stageRef.current;
      if (!stage) {
        return { x: screenX, y: screenY };
      }

      // Get the stage's bounding rect to account for its position on the page
      const stageBox = stage.container().getBoundingClientRect();

      // Convert screen coordinates to stage-relative coordinates
      const stageX = screenX - stageBox.left;
      const stageY = screenY - stageBox.top;

      // Apply inverse transform (account for pan and zoom)
      const x = (stageX - viewport.x) / viewport.scale;
      const y = (stageY - viewport.y) / viewport.scale;

      return { x, y };
    },
    [stageRef, viewport]
  );

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDragStart,
    handleDragEnd,
    isPanning,
    screenToCanvas,
  };
}
