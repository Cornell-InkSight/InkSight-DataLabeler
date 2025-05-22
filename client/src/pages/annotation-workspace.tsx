import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import VideoPlayer from "@/components/video-player";
import AnnotationCanvas from "@/components/annotation-canvas";
import AnnotationTools from "@/components/annotation-tools";
import Timeline from "@/components/timeline";
import CollaborationPanel from "@/components/collaboration-panel";
import { useWebSocket } from "@/hooks/use-websocket";
import { useVideo } from "@/hooks/use-video";
import { useAnnotations } from "@/hooks/use-annotations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Download, Eye, Users } from "lucide-react";

interface VideoFile {
  id: number;
  originalName: string;
  duration: number;
  totalFrames: number;
  resolution: string;
  status: string;
}

export default function AnnotationWorkspace() {
  const { videoId } = useParams();
  const [selectedTool, setSelectedTool] = useState<string>("bounding-box");
  const [selectedAnnotationType, setSelectedAnnotationType] = useState<string>("handwritten-text");
  const [showCollaboration, setShowCollaboration] = useState(false);

  const { data: videoFile, isLoading } = useQuery<VideoFile>({
    queryKey: [`/api/video-files/${videoId}`],
    enabled: !!videoId,
  });

  const {
    currentFrame,
    setCurrentFrame,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
  } = useVideo();

  const {
    annotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    isCreating,
  } = useAnnotations(videoFile?.id);

  const { collaborators, sendMessage } = useWebSocket(videoFile?.id);

  useEffect(() => {
    if (videoFile?.id) {
      sendMessage('join', {
        userId: 1, // TODO: Get from auth context
        videoFileId: videoFile.id,
        currentFrame,
      });
    }
  }, [videoFile?.id, sendMessage]);

  useEffect(() => {
    if (videoFile?.id) {
      sendMessage('frame_change', {
        frameNumber: currentFrame,
      });
    }
  }, [currentFrame, videoFile?.id, sendMessage]);

  const handleSaveProgress = async () => {
    // Progress is auto-saved via WebSocket, this is for manual trigger
    console.log("Manual save triggered");
  };

  const handleExport = async () => {
    if (!videoFile?.id) return;
    
    try {
      const response = await fetch(`/api/export/${videoFile.id}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${videoFile.originalName}_annotations.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading annotation workspace...</p>
        </div>
      </div>
    );
  }

  if (!videoFile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Video file not found</p>
        </div>
      </div>
    );
  }

  const frameAnnotations = annotations.filter(ann => ann.frameNumber === currentFrame);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                  <Eye className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{videoFile.originalName}</h2>
                  <p className="text-sm text-slate-600">
                    {videoFile.resolution} • {Math.floor(videoFile.duration / 60)}:{(videoFile.duration % 60).toFixed(0).padStart(2, '0')}
                  </p>
                </div>
              </div>
              <Badge variant={videoFile.status === "completed" ? "default" : "secondary"}>
                {videoFile.status}
              </Badge>
            </div>

            <div className="flex items-center space-x-3">
              {/* Collaboration Indicator */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCollaboration(!showCollaboration)}
                className="flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>{collaborators.length} online</span>
              </Button>

              <Button variant="outline" size="sm" onClick={handleSaveProgress}>
                <Save className="w-4 h-4 mr-2" />
                Save Progress
              </Button>

              <Button onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex">
          {/* Video and Canvas Area */}
          <div className="flex-1 flex flex-col bg-slate-900">
            <div className="flex-1 relative">
              <VideoPlayer
                currentFrame={currentFrame}
                totalFrames={videoFile.totalFrames}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                onFrameChange={setCurrentFrame}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onSpeedChange={setPlaybackSpeed}
              />
              
              <AnnotationCanvas
                annotations={frameAnnotations}
                selectedTool={selectedTool}
                selectedAnnotationType={selectedAnnotationType}
                onCreateAnnotation={createAnnotation}
                onUpdateAnnotation={updateAnnotation}
                onDeleteAnnotation={deleteAnnotation}
                currentFrame={currentFrame}
                videoFileId={videoFile.id}
              />
            </div>

            {/* Timeline */}
            <Timeline
              currentFrame={currentFrame}
              totalFrames={videoFile.totalFrames}
              annotations={annotations}
              onFrameChange={setCurrentFrame}
              videoFileId={videoFile.id}
            />
          </div>

          {/* Annotation Tools Panel */}
          <AnnotationTools
            selectedTool={selectedTool}
            selectedAnnotationType={selectedAnnotationType}
            annotations={frameAnnotations}
            onToolChange={setSelectedTool}
            onAnnotationTypeChange={setSelectedAnnotationType}
            onUpdateAnnotation={updateAnnotation}
            onDeleteAnnotation={deleteAnnotation}
            isCreating={isCreating}
          />

          {/* Collaboration Panel */}
          {showCollaboration && (
            <CollaborationPanel
              collaborators={collaborators}
              currentFrame={currentFrame}
              onClose={() => setShowCollaboration(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
