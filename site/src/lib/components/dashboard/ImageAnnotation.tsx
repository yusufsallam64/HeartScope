import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Circle, Square, Download, X, MousePointer, Eraser } from 'lucide-react';

interface ImageAnnotationProps {
  imageUrl: string;
  onClose: () => void;
}

type Tool = 'pointer' | 'pen' | 'circle' | 'square' | 'eraser';

interface Point {
  x: number;
  y: number;
}

interface Shape {
  id: string;
  type: 'circle' | 'square' | 'pen';
  points: Point[];
  color: string;
  lineWidth: number;
  isSelected?: boolean;
}

const isShapeComplete = (shape: Shape): boolean => {
  if (shape.type === 'pen') {
    return shape.points.length >= 2;
  }
  return shape.points.length === 2;
};

const ImageAnnotation = forwardRef<HTMLDivElement, ImageAnnotationProps>(({ imageUrl, onClose }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#FF0000');
  const [lineWidth, setLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [dragStartPos, setDragStartPos] = useState<Point | null>(null);
  const [isReady, setIsReady] = useState(false);
  const baseImageRef = useRef<ImageData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isErasing = useRef(false);

  useEffect(() => {
    const timer = setTimeout(initializeCanvas, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedShape) {
          deleteSelectedShape();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShape, shapes]);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    contextRef.current = ctx;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const containerWidth = container.clientWidth - 32;
      const containerHeight = container.clientHeight - 32;
      const scale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height
      );

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      baseImageRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setIsReady(true);
    };

    img.src = imageUrl;
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    if (!isShapeComplete(shape) && shape !== currentShape) return;

    ctx.beginPath();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (shape.type === 'pen') {
      const [first, ...rest] = shape.points;
      ctx.moveTo(first.x, first.y);
      rest.forEach(point => ctx.lineTo(point.x, point.y));
    } else if (shape.type === 'circle' && shape.points.length === 2) {
      const [center, end] = shape.points;
      const radius = Math.sqrt(
        Math.pow(end.x - center.x, 2) + Math.pow(end.y - center.y, 2)
      );
      ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    } else if (shape.type === 'square' && shape.points.length === 2) {
      const [start, end] = shape.points;
      ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
    }

    ctx.stroke();

    if (shape === selectedShape) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const isPointInShape = (point: Point, shape: Shape): boolean => {
    if (!isShapeComplete(shape)) return false;

    if (shape.type === 'circle') {
      const [center, end] = shape.points;
      const radius = Math.sqrt(
        Math.pow(end.x - center.x, 2) + Math.pow(end.y - center.y, 2)
      );
      const distance = Math.sqrt(
        Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
      );
      return distance <= radius + shape.lineWidth / 2;
    } else if (shape.type === 'square') {
      const [start, end] = shape.points;
      const minX = Math.min(start.x, end.x) - shape.lineWidth / 2;
      const maxX = Math.max(start.x, end.x) + shape.lineWidth / 2;
      const minY = Math.min(start.y, end.y) - shape.lineWidth / 2;
      const maxY = Math.max(start.y, end.y) + shape.lineWidth / 2;
      return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
    } else if (shape.type === 'pen') {
      return shape.points.some((p, i) => {
        if (i === 0) return false;
        const prev = shape.points[i - 1];
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) return false;

        const u = ((point.x - prev.x) * dx + (point.y - prev.y) * dy) / (length * length);
        if (u < 0 || u > 1) return false;

        const x = prev.x + u * dx;
        const y = prev.y + u * dy;
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
        return distance <= shape.lineWidth / 2;
      });
    }
    return false;
  };

  const findShapeAtPoint = (point: Point): Shape | null => {
    return shapes.findLast(shape => isPointInShape(point, shape)) || null;
  };

  const eraseShapesAtPoint = (point: Point) => {
    const erasedShapes = shapes.filter(shape => !isPointInShape(point, shape));
    if (erasedShapes.length < shapes.length) {
      setShapes(erasedShapes);
      redrawCanvas();
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contextRef.current || !isReady) return;

    const coords = getCanvasCoordinates(e);

    if (tool === 'pointer') {
      const clickedShape = findShapeAtPoint(coords);
      setSelectedShape(clickedShape);
      if (clickedShape) {
        setDragStartPos(coords);
      }
      return;
    }

    if (tool === 'eraser') {
      isErasing.current = true;
      eraseShapesAtPoint(coords);
      return;
    }

    setIsDrawing(true);
    const newShape: Shape = {
      id: Math.random().toString(36).substring(7),
      type: tool === 'pointer' ? 'pen' : tool,
      points: [coords],
      color,
      lineWidth
    };
    setCurrentShape(newShape);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contextRef.current || !isReady) return;

    const coords = getCanvasCoordinates(e);

    if (tool === 'eraser' && isErasing.current) {
      eraseShapesAtPoint(coords);
      return;
    }

    if (selectedShape && dragStartPos) {
      const dx = coords.x - dragStartPos.x;
      const dy = coords.y - dragStartPos.y;
      
      const newShapes = shapes.map(shape => 
        shape.id === selectedShape.id ? {
          ...shape,
          points: shape.points.map(p => ({
            x: p.x + dx,
            y: p.y + dy
          }))
        } : shape
      );
      
      setShapes(newShapes);
      setDragStartPos(coords);
      redrawCanvas();
      return;
    }

    if (isDrawing && currentShape) {
      if (currentShape.type === 'pen') {
        setCurrentShape({
          ...currentShape,
          points: [...currentShape.points, coords]
        });
      } else {
        setCurrentShape({
          ...currentShape,
          points: [currentShape.points[0], coords]
        });
      }
      redrawCanvas();
    }
  };

  const stopDrawing = () => {
    isErasing.current = false;
    setDragStartPos(null);

    if (isDrawing && currentShape) {
      setShapes([...shapes, currentShape]);
    }
    
    setIsDrawing(false);
    setCurrentShape(null);
    redrawCanvas();
  };

  const redrawCanvas = () => {
    if (!contextRef.current || !canvasRef.current || !baseImageRef.current) return;
    
    const ctx = contextRef.current;
    ctx.putImageData(baseImageRef.current, 0, 0);
    
    [...shapes, currentShape].filter(Boolean).forEach(shape => {
      if (shape) drawShape(ctx, shape);
    });
  };

  const deleteSelectedShape = () => {
    if (!selectedShape) return;
    const newShapes = shapes.filter(s => s.id !== selectedShape.id);
    setShapes(newShapes);
    setSelectedShape(null);
    redrawCanvas();
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'annotated-image.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const tools = [
    { id: 'pointer' as const, icon: MousePointer, label: 'Select & Move' },
    { id: 'pen' as const, icon: Pencil, label: 'Pen' },
    { id: 'circle' as const, icon: Circle, label: 'Circle' },
    { id: 'square' as const, icon: Square, label: 'Square' },
    { id: 'eraser' as const, icon: Eraser, label: 'Eraser' },
  ];

  return (
    <DialogContent className="max-w-6xl w-full p-0">
      <div className="relative flex flex-col h-[90vh]" ref={ref}>
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
                onClick={() => {
                  setTool(id);
                  setSelectedShape(null);
                }}
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
            onClick={downloadImage}
            title="Download"
          >
            <Download className="w-4 h-4" />
            <span className="sr-only">Download Image</span>
          </Button>

          {selectedShape && (
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8"
              onClick={deleteSelectedShape}
              title="Delete selected shape (Delete)"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Delete shape</span>
            </Button>
          )}
          
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
});

ImageAnnotation.displayName = 'ImageAnnotation';

export default ImageAnnotation;