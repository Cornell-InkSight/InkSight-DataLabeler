import { useState, useEffect, useCallback } from "react";
import { getWebSocketClient, WebSocketClient } from "@/lib/websocket";

interface CollaborationSession {
  id: number;
  userId: number;
  currentFrame: number;
  isActive: boolean;
  lastActivity: string;
  user?: {
    username: string;
    role: string;
  };
}

export function useWebSocket(videoFileId?: number) {
  const [collaborators, setCollaborators] = useState<CollaborationSession[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocketClient | null>(null);

  useEffect(() => {
    const wsClient = getWebSocketClient();
    setWs(wsClient);

    // Check connection status
    const checkConnection = () => {
      setIsConnected(wsClient.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    // Set up message handlers
    const handleCollaboratorsUpdate = (data: CollaborationSession[]) => {
      setCollaborators(data);
    };

    const handleCollaboratorFrameChange = (data: { userId: number; frameNumber: number }) => {
      setCollaborators(prev => 
        prev.map(collaborator => 
          collaborator.userId === data.userId 
            ? { ...collaborator, currentFrame: data.frameNumber, lastActivity: new Date().toISOString() }
            : collaborator
        )
      );
    };

    const handleAnnotationCreated = (data: any) => {
      // Handle real-time annotation updates
      console.log('Annotation created by collaborator:', data);
    };

    const handleAnnotationUpdated = (data: any) => {
      // Handle real-time annotation updates
      console.log('Annotation updated by collaborator:', data);
    };

    const handleAnnotationDeleted = (data: any) => {
      // Handle real-time annotation deletions
      console.log('Annotation deleted by collaborator:', data);
    };

    // Register event handlers
    wsClient.on('collaborators_updated', handleCollaboratorsUpdate);
    wsClient.on('collaborator_frame_change', handleCollaboratorFrameChange);
    wsClient.on('annotation_created', handleAnnotationCreated);
    wsClient.on('annotation_updated', handleAnnotationUpdated);
    wsClient.on('annotation_deleted', handleAnnotationDeleted);

    return () => {
      clearInterval(interval);
      // Clean up event handlers
      wsClient.off('collaborators_updated', handleCollaboratorsUpdate);
      wsClient.off('collaborator_frame_change', handleCollaboratorFrameChange);
      wsClient.off('annotation_created', handleAnnotationCreated);
      wsClient.off('annotation_updated', handleAnnotationUpdated);
      wsClient.off('annotation_deleted', handleAnnotationDeleted);
    };
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    if (ws && isConnected) {
      ws.send(type, data);
    }
  }, [ws, isConnected]);

  const joinVideo = useCallback((userId: number, frameNumber: number = 1) => {
    if (videoFileId) {
      sendMessage('join', {
        userId,
        videoFileId,
        currentFrame: frameNumber,
      });
    }
  }, [videoFileId, sendMessage]);

  const updateFrame = useCallback((frameNumber: number) => {
    sendMessage('frame_change', {
      frameNumber,
    });
  }, [sendMessage]);

  const broadcastAnnotationChange = useCallback((type: 'created' | 'updated' | 'deleted', annotation: any) => {
    sendMessage(`annotation_${type}`, annotation);
  }, [sendMessage]);

  return {
    collaborators,
    isConnected,
    sendMessage,
    joinVideo,
    updateFrame,
    broadcastAnnotationChange,
  };
}
