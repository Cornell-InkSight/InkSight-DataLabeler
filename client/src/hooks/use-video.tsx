import { useState, useCallback } from "react";

export function useVideo() {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleFrameChange = useCallback((frame: number) => {
    setCurrentFrame(frame);
    // Convert frame to time assuming 30 FPS
    const timeInSeconds = frame / 30;
    setCurrentTime(timeInSeconds);
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);

  const stepFrame = useCallback((direction: 'forward' | 'backward', totalFrames: number) => {
    const step = direction === 'forward' ? 1 : -1;
    const newFrame = Math.max(1, Math.min(totalFrames, currentFrame + step));
    handleFrameChange(newFrame);
  }, [currentFrame, handleFrameChange]);

  const jumpToFrame = useCallback((frame: number, totalFrames: number) => {
    const clampedFrame = Math.max(1, Math.min(totalFrames, frame));
    handleFrameChange(clampedFrame);
  }, [handleFrameChange]);

  const jumpToTime = useCallback((timeInSeconds: number, totalFrames: number) => {
    // Convert time to frame assuming 30 FPS
    const frame = Math.round(timeInSeconds * 30);
    jumpToFrame(frame, totalFrames);
  }, [jumpToFrame]);

  const jumpToPercentage = useCallback((percentage: number, totalFrames: number) => {
    const frame = Math.round((percentage / 100) * totalFrames);
    jumpToFrame(frame, totalFrames);
  }, [jumpToFrame]);

  const formatTime = useCallback((frameNumber: number) => {
    const seconds = Math.floor(frameNumber / 30);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const getProgress = useCallback((totalFrames: number) => {
    return totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0;
  }, [currentFrame]);

  return {
    // State
    currentFrame,
    isPlaying,
    playbackSpeed,
    currentTime,
    duration,

    // Actions
    setCurrentFrame: handleFrameChange,
    setIsPlaying,
    setPlaybackSpeed: handleSpeedChange,
    setDuration,

    // Methods
    stepFrame,
    jumpToFrame,
    jumpToTime,
    jumpToPercentage,
    formatTime,
    getProgress,
    handlePlayPause,
  };
}
