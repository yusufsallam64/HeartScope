import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Circle, Square, Undo, Download, X, MousePointer } from 'lucide-react';

interface ImageAnnotationProps {
  imageUrl: string;
  onClose: () => void;
}

type Tool = 'pointer' | 'pen' | 'circle' | 'square';

const ImageAnnotation: React.FC<ImageAnnotationProps> = ({ imageUrl, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#FF0000');
  const [lineWidth, setLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  const logDebug = (message: string, data?: any) => {
    console.log(`[ImageAnnotation Debug] ${message}`, data || '');
  };

  // Initialize canvas after the Dialog is fully mounted
  useEffect(() => {
    // Small delay to ensure Dialog is mounted
    const timer = setTimeout(() => {
      initializeCanvas();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const initializeCanvas = () => {
    logDebug('Initializing canvas');
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      logDebug('Canvas or container not available yet');
      return;
    }

    // Initial canvas setup
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      logDebug('Failed to get canvas context');
      return;
    }
    contextRef.current = ctx;

    // Load and set up image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      logDebug('Image loaded successfully', {
        width: img.width,
        height: img.height
      });

      // Get container dimensions (accounting for padding)
      const containerWidth = container.clientWidth - 32;
      const containerHeight = container.clientHeight - 32;

      // Calculate scale to fit image while maintaining aspect ratio
      const scale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height
      );

      // Set canvas dimensions to match scaled image
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      logDebug('Canvas dimensions set', {
        width: canvas.width,
        height: canvas.height
      });

      // Draw image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Save initial state
      const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setUndoStack([initialState]);
      setIsReady(true);
    };

    img.onerror = (error) => {
      logDebug('Error loading image', error);
    };

    img.src = imageUrl;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contextRef.current || tool === 'pointer' || !isReady) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current!.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current!.height / rect.height);

    setIsDrawing(true);
    setStartPos({ x, y });

    const ctx = contextRef.current;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    logDebug('Drawing started', { x, y, tool });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current || tool === 'pointer' || !isReady) {
      return;
    }

    const ctx = contextRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    if (tool === 'pen') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      // Restore last state for shape preview
      const lastState = undoStack[undoStack.length - 1];
      if (lastState) {
        ctx.putImageData(lastState, 0, 0);
      }

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
        );
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      } else if (tool === 'square') {
        ctx.rect(
          startPos.x,
          startPos.y,
          x - startPos.x,
          y - startPos.y
        );
      }
      
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing && contextRef.current && canvasRef.current && isReady) {
      const newState = contextRef.current.getImageData(
        0, 0, 
        canvasRef.current.width, 
        canvasRef.current.height
      );
      setUndoStack(prev => [...prev, newState]);
      logDebug('Drawing stopped, state saved');
    }
    setIsDrawing(false);
  };

  const undo = () => {
    if (!contextRef.current || !canvasRef.current || undoStack.length <= 1) return;
    
    const newStack = [...undoStack];
    newStack.pop();
    const previousState = newStack[newStack.length - 1];
    
    contextRef.current.putImageData(previousState, 0, 0);
    setUndoStack(newStack);
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'annotated-image.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const tools = [
    { id: 'pointer' as const, icon: MousePointer, label: 'Pointer' },
    { id: 'pen' as const, icon: Pencil, label: 'Pen' },
    { id: 'circle' as const, icon: Circle, label: 'Circle' },
    { id: 'square' as const, icon: Square, label: 'Square' },
  ];

  return (
    <DialogContent className="max-w-6xl w-full p-0">
      <div className="relative flex flex-col h-[90vh]">
        <DialogTitle className="sr-only">Image Annotation</DialogTitle>
        
        {/* Toolbar */}
        <div className="bg-white p-2 border-b flex items-center gap-2">
          <div className="flex items-center gap-1">
            {tools.map(({ id, icon: Icon, label }) => (
              <Button
                key={id}
                variant={tool === id ? "default" : "outline"}
                size="icon"
                className="w-8 h-8"
                onClick={() => setTool(id)}
                title={label}
              >
                <Icon className="w-4 h-4" />
                <span className="sr-only">{label}</span>
              </Button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-gray-200 mx-2" />
          
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 p-0 border rounded"
            title="Color"
            aria-label="Choose color"
          />
          
          <select
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="h-8 rounded border"
            title="Line Width"
            aria-label="Choose line width"
          >
            <option value="1">1px</option>
            <option value="2">2px</option>
            <option value="4">4px</option>
            <option value="6">6px</option>
          </select>
          
          <div className="h-6 w-px bg-gray-200 mx-2" />
          
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8"
            onClick={undo}
            title="Undo"
            disabled={undoStack.length <= 1}
          >
            <Undo className="w-4 h-4" />
            <span className="sr-only">Undo</span>
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8"
            onClick={downloadImage}
            title="Download"
          >
            <Download className="w-4 h-4" />
            <span className="sr-only">Download Image</span>
          </Button>
          
          <div className="ml-auto">
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full w-8 h-8"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Canvas Container */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center"
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full bg-white shadow-lg rounded-lg"
            style={{
              cursor: tool === 'pointer' ? 'default' : 'crosshair'
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            role="img"
            aria-label="Image annotation canvas"
          />
        </div>
      </div>
    </DialogContent>
  );
};

export default ImageAnnotation;