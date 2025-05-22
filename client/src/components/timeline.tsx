import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Play, Pause } from "lucide-react";

interface TimelineProps {
  currentFrame: number;
  totalFrames: number;
  annotations: any[];
  onFrameChange: (frame: number) => void;
  videoFileId: number;
}

interface TemporalEvent {
  id: number;
  eventType: string;
  frameNumber: number;
  timestamp: number;
}

export default function Timeline({
  currentFrame,
  totalFrames,
  annotations,
  onFrameChange,
  videoFileId,
}: TimelineProps) {
  const { data: temporalEvents } = useQuery<TemporalEvent[]>({
    queryKey: [`/api/temporal-events`, { videoFileId }],
    enabled: !!videoFileId,
  });

  const progressPercentage = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;

  const formatTime = (frameNumber: number) => {
    // Assuming 30 FPS
    const seconds = Math.floor(frameNumber / 30);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    return formatTime(totalFrames);
  };

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newFrame = Math.round(percentage * totalFrames);
    onFrameChange(Math.max(1, Math.min(totalFrames, newFrame)));
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'erasure':
        return '#EF4444'; // red
      case 'segment_start':
        return '#10B981'; // green
      case 'segment_end':
        return '#F59E0B'; // amber
      default:
        return '#6B7280'; // gray
    }
  };

  // Group annotations by frame ranges for visualization
  const getAnnotationDensity = () => {
    const density: { [key: number]: number } = {};
    annotations.forEach(ann => {
      const segment = Math.floor(ann.frameNumber / 1000); // Group by 1000-frame segments
      density[segment] = (density[segment] || 0) + 1;
    });
    return density;
  };

  const annotationDensity = getAnnotationDensity();

  return (
    <div className="bg-white border-t border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Timeline & Events</h3>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-slate-500">Zoom:</span>
          <Button variant="outline" size="sm" className="h-7 px-2">
            <ZoomOut className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2">1x</Button>
          <Button variant="outline" size="sm" className="h-7 px-2">2x</Button>
          <Button variant="default" size="sm" className="h-7 px-2">5x</Button>
          <Button variant="outline" size="sm" className="h-7 px-2">10x</Button>
          <Button variant="outline" size="sm" className="h-7 px-2">
            <ZoomIn className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Time markers */}
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>0:00</span>
          <span>{Math.floor(getTotalDuration().split(':')[0] / 5)}:00</span>
          <span>{Math.floor(getTotalDuration().split(':')[0] / 2.5)}:00</span>
          <span>{Math.floor(getTotalDuration().split(':')[0] / 1.67)}:00</span>
          <span>{Math.floor(getTotalDuration().split(':')[0] / 1.25)}:00</span>
          <span>{getTotalDuration()}</span>
        </div>

        {/* Timeline track */}
        <div 
          className="relative w-full h-12 bg-slate-100 rounded-lg overflow-hidden cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* Progress indicator */}
          <div className="absolute left-0 top-0 w-full h-2 bg-slate-200">
            <div 
              className="h-full bg-primary/30 transition-all duration-200" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Annotation density visualization */}
          <div className="absolute top-2 left-0 right-0 h-2">
            {Object.entries(annotationDensity).map(([segment, count]) => {
              const segmentPercentage = (parseInt(segment) * 1000) / totalFrames * 100;
              const segmentWidth = (1000 / totalFrames) * 100;
              const opacity = Math.min(count / 10, 1); // Max opacity at 10 annotations
              
              return (
                <div
                  key={segment}
                  className="absolute h-full bg-blue-400"
                  style={{
                    left: `${segmentPercentage}%`,
                    width: `${segmentWidth}%`,
                    opacity: opacity * 0.6,
                  }}
                />
              );
            })}
          </div>

          {/* Temporal events */}
          <div className="absolute inset-0">
            {temporalEvents?.map((event) => {
              const eventPercentage = (event.frameNumber / totalFrames) * 100;
              const color = getEventColor(event.eventType);
              
              return (
                <div
                  key={event.id}
                  className="absolute w-1 h-full"
                  style={{
                    left: `${eventPercentage}%`,
                    backgroundColor: color,
                  }}
                  title={`${event.eventType} at ${formatTime(event.frameNumber)}`}
                />
              );
            })}
          </div>

          {/* Current position indicator */}
          <div 
            className="absolute top-0 w-0.5 h-full bg-primary z-10"
            style={{ left: `${progressPercentage}%` }}
          >
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md" />
          </div>
        </div>

        {/* Event legend */}
        <div className="flex items-center space-x-6 mt-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-slate-600">Erasure Events ({temporalEvents?.filter(e => e.eventType === 'erasure').length || 0})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-slate-600">Segment Starts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span className="text-slate-600">Segment Ends</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span className="text-slate-600">Annotation Density</span>
          </div>
        </div>
      </div>

      {/* Frame Navigation Controls */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-4 text-sm text-slate-600">
          <span>Frame: <span className="font-mono font-medium text-slate-900">{currentFrame.toLocaleString()}</span> / <span className="font-mono font-medium text-slate-900">{totalFrames.toLocaleString()}</span></span>
          <span>Time: <span className="font-mono font-medium text-slate-900">{formatTime(currentFrame)}</span> / <span className="font-mono font-medium text-slate-900">{getTotalDuration()}</span></span>
          <span>Annotations: <span className="font-semibold text-primary">{annotations.length}</span></span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFrameChange(Math.max(1, currentFrame - 1))}
            disabled={currentFrame <= 1}
          >
            ← Prev Frame
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFrameChange(Math.min(totalFrames, currentFrame + 1))}
            disabled={currentFrame >= totalFrames}
          >
            Next Frame →
          </Button>
        </div>
      </div>

      {/* Quick Jump Controls */}
      <div className="mt-2">
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500">Quick jump:</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onFrameChange(1)}
          >
            Start
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onFrameChange(Math.floor(totalFrames * 0.25))}
          >
            25%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onFrameChange(Math.floor(totalFrames * 0.5))}
          >
            50%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onFrameChange(Math.floor(totalFrames * 0.75))}
          >
            75%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onFrameChange(totalFrames)}
          >
            End
          </Button>
        </div>
      </div>
    </div>
  );
}
