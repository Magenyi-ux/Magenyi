import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface WhiteboardRef {
    clear: () => void;
    getImageDataURL: () => string;
    undo: () => void;
    redo: () => void;
    downloadImage: () => void;
}

interface WhiteboardProps {
    isDarkMode: boolean;
    strokeColor: string;
    lineWidth: number;
    resizeTrigger: number;
    isErasing: boolean;
    onHistoryChange: (state: { canUndo: boolean; canRedo: boolean }) => void;
}

const Whiteboard = forwardRef<WhiteboardRef, WhiteboardProps>(({ isDarkMode, strokeColor, lineWidth, resizeTrigger, isErasing, onHistoryChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // One-time setup for canvas context
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                setContext(ctx);
            }
        }
    }, []);

    // Effect to handle theme, style changes, or resizing
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = context;
        if (!canvas || !ctx) return;

        const container = canvas.parentElement;
        if (container) {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if(tempCtx) {
                // Before resizing, save the current drawing to a temporary canvas.
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                tempCtx.drawImage(canvas, 0, 0);
            }
            
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            
            applyStyles(ctx, isDarkMode);

            // After resizing, draw the old content back.
            if(tempCtx) {
                ctx.drawImage(tempCanvas, 0, 0);
            }
        } else {
            applyStyles(ctx, isDarkMode);
        }

    }, [isDarkMode, context, resizeTrigger]);

    // Save initial state
    useEffect(() => {
        if (context && canvasRef.current && canvasRef.current.width > 0 && history.length === 0) {
            saveState();
        }
    }, [context, history.length]);


    // Update drawing style when props change
    useEffect(() => {
      if (context) {
        if (isErasing) {
            context.strokeStyle = isDarkMode ? '#1e293b' : '#ffffff'; // slate-800 or white
        } else {
            context.strokeStyle = strokeColor;
        }
        context.lineWidth = lineWidth;
      }
    }, [strokeColor, lineWidth, context, isErasing, isDarkMode]);

    useEffect(() => {
        onHistoryChange({
            canUndo: historyIndex > 0,
            canRedo: historyIndex < history.length - 1,
        });
    }, [history, historyIndex, onHistoryChange]);

    // Centralized function to apply styles and background
    const applyStyles = (ctx: CanvasRenderingContext2D, isDark: boolean) => {
        if (ctx && canvasRef.current) {
            ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const saveState = useCallback(() => {
        if (!context || !canvasRef.current || canvasRef.current.width === 0) return;
        const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, imageData]);
        setHistoryIndex(newHistory.length);
    }, [context, history, historyIndex]);
    
    const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return null;
        const rect = canvasRef.current.getBoundingClientRect();
        let clientX, clientY;
        if ('touches' in event.nativeEvent) {
            clientX = event.nativeEvent.touches[0].clientX;
            clientY = event.nativeEvent.touches[0].clientY;
        } else {
            clientX = (event as React.MouseEvent).clientX;
            clientY = (event as React.MouseEvent).clientY;
        }
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
        const coords = getCoordinates(event);
        if (context && coords) {
            setIsDrawing(true);
            context.beginPath();
            context.moveTo(coords.x, coords.y);
        }
    }, [context]);

    const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        event.preventDefault();
        const coords = getCoordinates(event);
        if (context && coords) {
            context.lineTo(coords.x, coords.y);
            context.stroke();
        }
    }, [isDrawing, context]);

    const stopDrawing = useCallback(() => {
        if (context) {
            context.closePath();
            if (isDrawing) {
              saveState();
            }
            setIsDrawing(false);
        }
    }, [context, isDrawing, saveState]);

    const handleClear = () => {
        if (context) {
            applyStyles(context, isDarkMode);
            saveState();
        }
    };
    
    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            context?.putImageData(history[newIndex], 0, 0);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            context?.putImageData(history[newIndex], 0, 0);
        }
    };

    const getImageDataURL = (): string => {
        if (canvasRef.current && context) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasRef.current.width;
            tempCanvas.height = canvasRef.current.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.fillStyle = '#FFFFFF';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(canvasRef.current, 0, 0);
                return tempCanvas.toDataURL('image/png');
            }
        }
        return '';
    };

    const handleDownload = () => {
        const dataUrl = getImageDataURL();
        if (dataUrl) {
            const link = document.createElement('a');
            link.download = 'whiteboard-drawing.png';
            link.href = dataUrl;
            link.click();
        }
    };

    useImperativeHandle(ref, () => ({
        clear: handleClear,
        getImageDataURL: getImageDataURL,
        undo: handleUndo,
        redo: handleRedo,
        downloadImage: handleDownload,
    }));

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
            style={{ touchAction: 'none' }}
        />
    );
});

export default Whiteboard;