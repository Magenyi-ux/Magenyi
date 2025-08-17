
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface WhiteboardProps {
    isDarkMode: boolean;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas dimensions based on container size
        const container = canvas.parentElement;
        if (container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setContext(ctx);
        clearCanvas(ctx, isDarkMode);
      }
    }
  }, [isDarkMode]);

  const clearCanvas = (ctx: CanvasRenderingContext2D, isDark: boolean) => {
    if (ctx && canvasRef.current) {
        ctx.fillStyle = isDark ? '#1e293b' : '#ffffff'; // slate-800 or white
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.strokeStyle = isDark ? '#f1f5f9' : '#0f172a'; // slate-100 or slate-900
        ctx.lineWidth = 3;
    }
  };
  
  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    if ('touches' in event.nativeEvent) {
      return {
        x: event.nativeEvent.touches[0].clientX - rect.left,
        y: event.nativeEvent.touches[0].clientY - rect.top,
      };
    }
    return {
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
    };
  };

  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(event);
    if (context && coords) {
      context.beginPath();
      context.moveTo(coords.x, coords.y);
      setIsDrawing(true);
    }
  }, [context]);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(event);
    if (context && coords) {
      context.lineTo(coords.x, coords.y);
      context.stroke();
    }
  }, [isDrawing, context]);

  const stopDrawing = useCallback(() => {
    if (context) {
      context.closePath();
      setIsDrawing(false);
    }
  }, [context]);
  
  const handleClear = () => {
      if (context) {
          clearCanvas(context, isDarkMode);
      }
  };

  const getImageData = (): string => {
      if(canvasRef.current) {
        return canvasRef.current.toDataURL('image/png').split(',')[1];
      }
      return '';
  };

  // Expose methods to parent via ref forwarding if needed, but for now we'll pass them down as props in the page component.
  // This is a simplified approach. A more robust way would be using forwardRef and useImperativeHandle.
  // We will manage it in the parent component `SolverPage.tsx`
  useEffect(() => {
    (window as any).clearWhiteboard = handleClear;
    (window as any).getWhiteboardData = getImageData;
  }, [handleClear, getImageData]);


  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      className="w-full h-full rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-crosshair"
    />
  );
};

export default Whiteboard;
