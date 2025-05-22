export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasAnnotation {
  id: string;
  type: 'bounding-box' | 'polygon' | 'freehand';
  coordinates: BoundingBox | { points: Point[] } | { path: Point[] };
  color: string;
  label?: string;
}

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private annotations: CanvasAnnotation[] = [];
  private currentDrawing: Point[] = [];
  private isDrawing = false;
  private selectedTool: string = 'bounding-box';
  private selectedColor: string = '#3B82F6';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
  }

  private getMousePos(event: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private handleMouseDown(event: MouseEvent) {
    const pos = this.getMousePos(event);
    this.isDrawing = true;

    if (this.selectedTool === 'bounding-box') {
      this.currentDrawing = [pos];
    } else if (this.selectedTool === 'freehand') {
      this.currentDrawing = [pos];
    } else if (this.selectedTool === 'polygon') {
      this.currentDrawing.push(pos);
    }
  }

  private handleMouseMove(event: MouseEvent) {
    if (!this.isDrawing) return;

    const pos = this.getMousePos(event);

    if (this.selectedTool === 'bounding-box') {
      this.currentDrawing = [this.currentDrawing[0], pos];
      this.redraw();
    } else if (this.selectedTool === 'freehand') {
      this.currentDrawing.push(pos);
      this.redraw();
    }
  }

  private handleMouseUp(event: MouseEvent) {
    if (!this.isDrawing) return;

    this.isDrawing = false;

    if (this.selectedTool === 'bounding-box' && this.currentDrawing.length === 2) {
      this.createBoundingBox();
    } else if (this.selectedTool === 'freehand' && this.currentDrawing.length > 2) {
      this.createFreehandPath();
    }

    // Don't clear for polygon - it's handled in double-click
    if (this.selectedTool !== 'polygon') {
      this.currentDrawing = [];
    }
  }

  private handleDoubleClick(event: MouseEvent) {
    if (this.selectedTool === 'polygon' && this.currentDrawing.length >= 3) {
      this.createPolygon();
      this.currentDrawing = [];
    }
  }

  private createBoundingBox() {
    const start = this.currentDrawing[0];
    const end = this.currentDrawing[1];
    
    const annotation: CanvasAnnotation = {
      id: this.generateId(),
      type: 'bounding-box',
      coordinates: {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
      },
      color: this.selectedColor,
    };

    this.annotations.push(annotation);
    this.redraw();
  }

  private createPolygon() {
    const annotation: CanvasAnnotation = {
      id: this.generateId(),
      type: 'polygon',
      coordinates: {
        points: [...this.currentDrawing],
      },
      color: this.selectedColor,
    };

    this.annotations.push(annotation);
    this.redraw();
  }

  private createFreehandPath() {
    const annotation: CanvasAnnotation = {
      id: this.generateId(),
      type: 'freehand',
      coordinates: {
        path: [...this.currentDrawing],
      },
      color: this.selectedColor,
    };

    this.annotations.push(annotation);
    this.redraw();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw existing annotations
    this.annotations.forEach(annotation => {
      this.drawAnnotation(annotation);
    });

    // Draw current drawing
    if (this.currentDrawing.length > 0) {
      this.drawCurrentPath();
    }
  }

  private drawAnnotation(annotation: CanvasAnnotation) {
    this.ctx.strokeStyle = annotation.color;
    this.ctx.fillStyle = annotation.color + '20'; // 20% opacity
    this.ctx.lineWidth = 2;

    if (annotation.type === 'bounding-box') {
      const coords = annotation.coordinates as BoundingBox;
      this.ctx.strokeRect(coords.x, coords.y, coords.width, coords.height);
      this.ctx.fillRect(coords.x, coords.y, coords.width, coords.height);
    } else if (annotation.type === 'polygon') {
      const coords = annotation.coordinates as { points: Point[] };
      this.drawPolygonPath(coords.points, true);
    } else if (annotation.type === 'freehand') {
      const coords = annotation.coordinates as { path: Point[] };
      this.drawFreehandPath(coords.path);
    }
  }

  private drawCurrentPath() {
    this.ctx.strokeStyle = this.selectedColor;
    this.ctx.lineWidth = 2;

    if (this.selectedTool === 'bounding-box' && this.currentDrawing.length === 2) {
      const start = this.currentDrawing[0];
      const end = this.currentDrawing[1];
      const width = end.x - start.x;
      const height = end.y - start.y;
      this.ctx.strokeRect(start.x, start.y, width, height);
    } else if (this.selectedTool === 'polygon') {
      this.drawPolygonPath(this.currentDrawing, false);
    } else if (this.selectedTool === 'freehand') {
      this.drawFreehandPath(this.currentDrawing);
    }
  }

  private drawPolygonPath(points: Point[], closed: boolean) {
    if (points.length === 0) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    if (closed) {
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.stroke();
  }

  private drawFreehandPath(points: Point[]) {
    if (points.length === 0) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    this.ctx.stroke();
  }

  public setTool(tool: string) {
    this.selectedTool = tool;
    this.currentDrawing = [];
  }

  public setColor(color: string) {
    this.selectedColor = color;
  }

  public getAnnotations(): CanvasAnnotation[] {
    return [...this.annotations];
  }

  public clearAnnotations() {
    this.annotations = [];
    this.redraw();
  }

  public removeAnnotation(id: string) {
    this.annotations = this.annotations.filter(a => a.id !== id);
    this.redraw();
  }

  public resize() {
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
      this.redraw();
    }
  }
}

export function useCanvas(canvasRef: React.RefObject<HTMLCanvasElement>) {
  let canvasManager: CanvasManager | null = null;

  const initCanvas = () => {
    if (canvasRef.current && !canvasManager) {
      canvasManager = new CanvasManager(canvasRef.current);
    }
    return canvasManager;
  };

  const getCanvasManager = () => canvasManager;

  return {
    initCanvas,
    getCanvasManager,
  };
}
