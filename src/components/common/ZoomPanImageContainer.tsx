import React, { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { PlusIcon, MinusIcon, MaximizeIcon } from '@heroicons/react/24/solid'; // Example icons

interface ZoomPanImageContainerProps {
  children: ReactNode;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (x: number, y: number) => void;
  className?: string;
}

const ZoomPanImageContainer: React.FC<ZoomPanImageContainerProps> = ({
  children,
  initialZoom = 1,
  minZoom = 0.5,
  maxZoom = 3,
  onZoomChange,
  onPanChange,
  className = '',
}) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false); // New state for pinch-to-zoom
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePosition = useRef<{ x: number; y: number } | null>(null);
  const initialPinchDistance = useRef<number | null>(null);
  const initialPinchZoom = useRef<number | null>(null);

  const clampZoom = useCallback((newZoom: number) => {
    return Math.max(minZoom, Math.min(newZoom, maxZoom));
  }, [minZoom, maxZoom]);

  const resetZoomPan = useCallback(() => {
    setZoom(initialZoom);
    setOffsetX(0);
    setOffsetY(0);
    onZoomChange?.(initialZoom);
    onPanChange?.(0, 0);
  }, [initialZoom, onZoomChange, onPanChange]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleAmount = 1.1; // Zoom factor
    const newZoom = clampZoom(e.deltaY < 0 ? zoom * scaleAmount : zoom / scaleAmount);

    // Calculate new offset to zoom towards mouse cursor
    const newOffsetX = mouseX - ((mouseX - offsetX) * (newZoom / zoom));
    const newOffsetY = mouseY - ((mouseY - offsetY) * (newZoom / zoom));

    setZoom(newZoom);
    setOffsetX(newOffsetX);
    setOffsetY(newOffsetY);
    onZoomChange?.(newZoom);
    onPanChange?.(newOffsetX, newOffsetY);
  }, [zoom, offsetX, offsetY, clampZoom, onZoomChange, onPanChange]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !lastMousePosition.current) return;

    const dx = e.clientX - lastMousePosition.current.x;
    const dy = e.clientY - lastMousePosition.current.y;

    setOffsetX(prev => prev + dx);
    setOffsetY(prev => prev + dy);
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
    onPanChange?.(offsetX + dx, offsetY + dy);
  }, [isDragging, offsetX, offsetY, onPanChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastMousePosition.current = null;
  }, []);

  const handleDoubleClick = useCallback(() => {
    resetZoomPan();
  }, [resetZoomPan]);

  // Touch event handlers for pinch-to-zoom and two-finger pan
  const getPinchDistance = useCallback((touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      initialPinchDistance.current = getPinchDistance(e.touches);
      initialPinchZoom.current = zoom;
      e.preventDefault(); // Prevent default browser zoom/pan
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      lastMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [getPinchDistance, zoom]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isPinching && e.touches.length === 2) {
      if (initialPinchDistance.current && initialPinchZoom.current) {
        const newDistance = getPinchDistance(e.touches);
        const scaleFactor = newDistance / initialPinchDistance.current;
        const newZoom = clampZoom(initialPinchZoom.current * scaleFactor);

        // Center of the pinch gesture
        const pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        // Calculate new offset to zoom towards the pinch center
        const rect = containerRef.current!.getBoundingClientRect();
        const mouseX = pinchCenterX - rect.left;
        const mouseY = pinchCenterY - rect.top;

        const newOffsetX = mouseX - ((mouseX - offsetX) * (newZoom / zoom));
        const newOffsetY = mouseY - ((mouseY - offsetY) * (newZoom / zoom));
        
        setZoom(newZoom);
        setOffsetX(newOffsetX);
        setOffsetY(newOffsetY);
        onZoomChange?.(newZoom);
        onPanChange?.(newOffsetX, newOffsetY);
      }
      e.preventDefault();
    } else if (isDragging && e.touches.length === 1 && lastMousePosition.current) {
      const dx = e.touches[0].clientX - lastMousePosition.current.x;
      const dy = e.touches[0].clientY - lastMousePosition.current.y;

      setOffsetX(prev => prev + dx);
      setOffsetY(prev => prev + dy);
      lastMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      onPanChange?.(offsetX + dx, offsetY + dy);
      e.preventDefault();
    }
  }, [isPinching, isDragging, getPinchDistance, zoom, offsetX, offsetY, clampZoom, onZoomChange, onPanChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setIsPinching(false);
    lastMousePosition.current = null;
    initialPinchDistance.current = null;
    initialPinchZoom.current = null;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('dblclick', handleDoubleClick);
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);

      // Global listeners for mouseup and mousemove
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove);

      return () => {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('dblclick', handleDoubleClick);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);

        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [handleWheel, handleMouseDown, handleDoubleClick, handleMouseUp, handleMouseMove, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const handleZoomIn = () => {
    const newZoom = clampZoom(zoom * 1.2);
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  };
  const handleZoomOut = () => {
    const newZoom = clampZoom(zoom / 1.2);
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  };
  const handleZoomFit = () => {
    resetZoomPan();
  };


  return (
    <div
      ref={containerRef}
      className={`image-zoom-container ${isDragging ? 'grabbing' : ''} ${className}`}
    >
      <div
        className="image-zoom-content"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
          transition: isDragging || isPinching ? 'none' : 'transform 0.1s ease-out', // Smooth transition only when not actively dragging/pinching
        }}
      >
        {children}
      </div>

      <div className="zoom-controls">
        <button onClick={handleZoomOut} disabled={zoom <= minZoom} aria-label="Disminuir zoom">-</button>
        <button onClick={handleZoomFit} aria-label="Ajustar a pantalla">1:1</button>
        <button onClick={handleZoomIn} disabled={zoom >= maxZoom} aria-label="Aumentar zoom">+</button>
      </div>
    </div>
  );
};

export default ZoomPanImageContainer;