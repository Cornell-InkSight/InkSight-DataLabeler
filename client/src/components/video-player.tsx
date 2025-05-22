import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

interface VideoPlayerProps {
  currentFrame: number;
  totalFrames: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onFrameChange: (frame: number) => void;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
}

export default function VideoPlayer({
  currentFrame,
  totalFrames,
  isPlaying,
  playbackSpeed,
  onFrameChange,
  onPlayPause,
  onSpeedChange,
}: VideoPlayerProps) {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const progressPercentage = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;

  const formatTime = (frameNumber: number) => {
    // Assuming 30 FPS
    const seconds = Math.floor(frameNumber / 30);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (values: number[]) => {
    const newFrame = Math.round((values[0] / 100) * totalFrames);
    onFrameChange(newFrame);
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0] / 100;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const stepFrame = (direction: 'forward' | 'backward') => {
    const step = direction === 'forward' ? 1 : -1;
    const newFrame = Math.max(1, Math.min(totalFrames, currentFrame + step));
    onFrameChange(newFrame);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video Element - Placeholder for actual video */}
      <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
        {/* Simulated chalkboard lecture content */}
        <div className="relative w-4/5 h-4/5 bg-slate-900 rounded-lg border-4 border-slate-700 overflow-hidden">
          {/* Chalkboard texture */}
          <div 
            className="absolute inset-0 bg-slate-900"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }}
          />
          
          {/* Mathematical content */}
          <div className="absolute inset-0 p-8 text-green-300 font-mono text-lg">
            <div className="space-y-6">
              <div className="text-2xl font-bold text-white">Integration by Parts</div>
              <div className="text-xl">∫ u dv = uv - ∫ v du</div>
              <div className="mt-8">
                <div>Example: ∫ x sin(x) dx</div>
                <div className="mt-4 ml-4">
                  <div>Let u = x, dv = sin(x) dx</div>
                  <div>Then du = dx, v = -cos(x)</div>
                </div>
                <div className="mt-4">
                  <div>∫ x sin(x) dx = x(-cos(x)) - ∫ (-cos(x)) dx</div>
                  <div className="ml-16">= -x cos(x) + ∫ cos(x) dx</div>
                  <div className="ml-16">= -x cos(x) + sin(x) + C</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Frame info overlay */}
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-mono">
          Frame {currentFrame.toLocaleString()} / {totalFrames.toLocaleString()}
        </div>

        {/* Time overlay */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-mono">
          {formatTime(currentFrame)} / {formatTime(totalFrames)}
        </div>
      </div>

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm p-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[progressPercentage]}
            onValueChange={handleProgressChange}
            className="w-full"
            step={0.1}
            max={100}
          />
          <div className="flex justify-between text-xs text-white/70 mt-1">
            <span>{formatTime(currentFrame)}</span>
            <span>{formatTime(totalFrames)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Playback Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => stepFrame('backward')}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onPlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => stepFrame('forward')}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                <Volume2 className="w-4 h-4" />
              </Button>
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  className="w-full"
                  max={100}
                />
              </div>
            </div>
          </div>

          {/* Playback Speed */}
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm">Speed:</span>
            <Select
              value={playbackSpeed.toString()}
              onValueChange={(value) => onSpeedChange(parseFloat(value))}
            >
              <SelectTrigger className="w-20 h-8 bg-transparent border-white/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.25">0.25x</SelectItem>
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
