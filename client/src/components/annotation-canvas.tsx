import { useState, useRef, useEffect, useCallback } from "react";
import { useCanvas } from "@/lib/canvas-utils";

interface Annotation {
  id: number;
  annotationType: string;
  toolType: string;
  coordinates: any;
  label?: string;
  confidence?: number;
}

interface AnnotationCanvasProps {
  annotations: Annotation[];
  selectedTool: string;
  selectedAnnotationType: string;
  onCreateAnnotation: (annotation: any) => void;
  onUpdateAnnotation: (id: number, updates: any) => void;
  onDeleteAnnotation: (id: number) => void;
  currentFrame: number;
  videoFileId: number;
}

interface Point {
  x: number;
  y: number;
}

export default function AnnotationCanvas({
  annotations,
  selectedTool,
  selectedAnnotationType,
  onCreateAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  currentFrame,
  videoFileId,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<number | null>(null);

  const getAnnotationColor = (type: string) => {
    switch (type) {
      case 'handwritten-text':
        return '#F59E0B'; // amber
      case 'mathematical-notation':
        return '#10B981'; // emerald
      case 'diagram':
        return '#3B82F6'; // blue
      case 'background':
        return '#6B7280'; // gray
      case 'erasure-region':
        return '#EF4444'; // red
      default:
        return '#8B5CF6'; // purple
    }
  };

  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing annotations
    annotations.forEach((annotation) => {
      const color = getAnnotationColor(annotation.annotationType);
      ctx.strokeStyle = color;
      ctx.fillStyle = color + '20'; // 20% opacity for fill
      ctx.lineWidth = 2;

      if (annotation.toolType === 'bounding-box' && annotation.coordinates) {
        const { x, y, width, height } = annotation.coordinates;
        ctx.strokeRect(x, y, width, height);
        ctx.fillRect(x, y, width, height);

        // Draw label
        if (annotation.label) {
          ctx.fillStyle = color;
          ctx.font = '12px Inter';
          ctx.fillText(annotation.label, x, y - 5);
        }
      } else if (annotation.toolType === 'polygon' && annotation.coordinates?.points) {
        const points = annotation.coordinates.points;
        if (points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
        }
      } else if (annotation.toolType === 'freehand' && annotation.coordinates?.path) {
        const path = annotation.coordinates.path;
        if (path.length > 0) {
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
          }
          ctx.stroke();
        }
      }

      // Highlight selected annotation
      if (selectedAnnotation === annotation.id) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        
        if (annotation.toolType === 'bounding-box') {
          const { x, y, width, height } = annotation.coordinates;
          ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
        }
        
        ctx.setLineDash([]);
      }
    });

    // Draw current drawing path
    if (currentPath.length > 0) {
      const color = getAnnotationColor(selectedAnnotationType);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      if (selectedTool === 'freehand') {
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
      } else if (selectedTool === 'bounding-box' && currentPath.length === 2) {
        const start = currentPath[0];
        const end = currentPath[1];
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.strokeRect(start.x, start.y, width, height);
      } else if (selectedTool === 'polygon') {
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
      }
    }
  }, [annotations, selectedAnnotation, currentPath, selectedAnnotationType, selectedTool]);

  useEffect(() => {
    drawAnnotations();
  }, [drawAnnotations]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawAnnotations();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawAnnotations]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setIsDrawing(true);

    if (selectedTool === 'freehand') {
      setCurrentPath([pos]);
    } else if (selectedTool === 'bounding-box') {
      setCurrentPath([pos]);
    } else if (selectedTool === 'polygon') {
      setCurrentPath(prev => [...prev, pos]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const pos = getMousePos(e);

    if (selectedTool === 'freehand') {
      setCurrentPath(prev => [...prev, pos]);
      drawAnnotations();
    } else if (selectedTool === 'bounding-box' && currentPath.length === 1) {
      setCurrentPath([currentPath[0], pos]);
      drawAnnotations();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    setIsDrawing(false);

    if (selectedTool === 'bounding-box' && currentPath.length === 2) {
      const start = currentPath[0];
      const end = currentPath[1];
      const width = end.x - start.x;
      const height = end.y - start.y;

      if (Math.abs(width) > 10 && Math.abs(height) > 10) {
        const annotation = {
          videoFileId,
          frameNumber: currentFrame,
          annotationType: selectedAnnotationType,
          toolType: selectedTool,
          coordinates: {
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: Math.abs(width),
            height: Math.abs(height),
          },
          annotatedBy: 1, // TODO: Get from auth context
        };

        onCreateAnnotation(annotation);
      }
      setCurrentPath([]);
    } else if (selectedTool === 'freehand' && currentPath.length > 2) {
      const annotation = {
        videoFileId,
        frameNumber: currentFrame,
        annotationType: selectedAnnotationType,
        toolType: selectedTool,
        coordinates: {
          path: currentPath,
        },
        annotatedBy: 1, // TODO: Get from auth context
      };

      onCreateAnnotation(annotation);
      setCurrentPath([]);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'polygon' && currentPath.length >= 3) {
      const annotation = {
        videoFileId,
        frameNumber: currentFrame,
        annotationType: selectedAnnotationType,
        toolType: selectedTool,
        coordinates: {
          points: currentPath,
        },
        annotatedBy: 1, // TODO: Get from auth context
      };

      onCreateAnnotation(annotation);
      setCurrentPath([]);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    
    // Check if clicking on an existing annotation
    for (const annotation of annotations) {
      if (annotation.toolType === 'bounding-box' && annotation.coordinates) {
        const { x, y, width, height } = annotation.coordinates;
        if (pos.x >= x && pos.x <= x + width && pos.y >= y && pos.y <= y + height) {
          setSelectedAnnotation(annotation.id);
          return;
        }
      }
    }

    setSelectedAnnotation(null);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onClick={handleCanvasClick}
      style={{ pointerEvents: 'auto' }}
    />
  );
}
