import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertProjectSchema, insertVideoFileSchema, insertAnnotationSchema, insertTemporalEventSchema } from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

interface WebSocketMessage {
  type: string;
  data: any;
  userId?: number;
  videoFileId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<WebSocket, { userId: number; videoFileId?: number }>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    ws.on('message', async (message: string) => {
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(message);
        const clientInfo = clients.get(ws);

        switch (parsedMessage.type) {
          case 'join':
            clients.set(ws, {
              userId: parsedMessage.data.userId,
              videoFileId: parsedMessage.data.videoFileId,
            });
            
            // Create or update collaboration session
            if (parsedMessage.data.videoFileId) {
              await storage.createOrUpdateCollaborationSession({
                videoFileId: parsedMessage.data.videoFileId,
                userId: parsedMessage.data.userId,
                currentFrame: parsedMessage.data.currentFrame || 1,
              });
            }

            // Broadcast updated collaborator list
            await broadcastCollaborators(parsedMessage.data.videoFileId);
            break;

          case 'frame_change':
            if (clientInfo) {
              // Update user's current frame
              if (clientInfo.videoFileId) {
                await storage.createOrUpdateCollaborationSession({
                  videoFileId: clientInfo.videoFileId,
                  userId: clientInfo.userId,
                  currentFrame: parsedMessage.data.frameNumber,
                });
              }

              // Broadcast frame change to other collaborators
              broadcastToOthers(ws, {
                type: 'collaborator_frame_change',
                data: {
                  userId: clientInfo.userId,
                  frameNumber: parsedMessage.data.frameNumber,
                },
              });
            }
            break;

          case 'annotation_created':
          case 'annotation_updated':
          case 'annotation_deleted':
            // Broadcast annotation changes to other collaborators
            if (clientInfo?.videoFileId) {
              broadcastToVideoFile(clientInfo.videoFileId, ws, parsedMessage);
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      const clientInfo = clients.get(ws);
      if (clientInfo?.videoFileId) {
        // Deactivate collaboration session
        const sessions = await storage.getActiveCollaborators(clientInfo.videoFileId);
        const session = sessions.find(s => s.userId === clientInfo.userId);
        if (session) {
          await storage.deactivateCollaborationSession(session.id);
        }

        // Broadcast updated collaborator list
        await broadcastCollaborators(clientInfo.videoFileId);
      }
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });
  });

  async function broadcastCollaborators(videoFileId: number) {
    const collaborators = await storage.getActiveCollaborators(videoFileId);
    const message = {
      type: 'collaborators_updated',
      data: collaborators,
    };

    broadcastToVideoFile(videoFileId, null, message);
  }

  function broadcastToVideoFile(videoFileId: number, excludeWs: WebSocket | null, message: WebSocketMessage) {
    clients.forEach((clientInfo, ws) => {
      if (clientInfo.videoFileId === videoFileId && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  function broadcastToOthers(excludeWs: WebSocket, message: WebSocketMessage) {
    clients.forEach((clientInfo, ws) => {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  // REST API Routes

  // Projects
  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const validated = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validated);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: 'Invalid project data' });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  });

  // Video files
  app.get('/api/video-files', async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const videoFiles = await storage.getVideoFiles(projectId);
      res.json(videoFiles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch video files' });
    }
  });

  app.post('/api/video-files/upload', upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No video file provided' });
      }

      const { projectId, uploadedBy } = req.body;
      
      const videoFile = await storage.createVideoFile({
        projectId: parseInt(projectId),
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        uploadedBy: parseInt(uploadedBy),
        status: 'processing',
      });

      res.status(201).json(videoFile);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload video file' });
    }
  });

  app.get('/api/video-files/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const videoFile = await storage.getVideoFile(id);
      if (!videoFile) {
        return res.status(404).json({ message: 'Video file not found' });
      }
      res.json(videoFile);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch video file' });
    }
  });

  app.patch('/api/video-files/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const videoFile = await storage.updateVideoFile(id, updates);
      if (!videoFile) {
        return res.status(404).json({ message: 'Video file not found' });
      }
      res.json(videoFile);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update video file' });
    }
  });

  // Annotations
  app.get('/api/annotations', async (req, res) => {
    try {
      const videoFileId = parseInt(req.query.videoFileId as string);
      const frameNumber = req.query.frameNumber ? parseInt(req.query.frameNumber as string) : undefined;
      
      const annotations = await storage.getAnnotations(videoFileId, frameNumber);
      res.json(annotations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch annotations' });
    }
  });

  app.post('/api/annotations', async (req, res) => {
    try {
      const validated = insertAnnotationSchema.parse(req.body);
      const annotation = await storage.createAnnotation(validated);
      
      // Broadcast to collaborators
      const message = {
        type: 'annotation_created',
        data: annotation,
      };
      broadcastToVideoFile(annotation.videoFileId, null, message);
      
      res.status(201).json(annotation);
    } catch (error) {
      res.status(400).json({ message: 'Invalid annotation data' });
    }
  });

  app.patch('/api/annotations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const annotation = await storage.updateAnnotation(id, updates);
      if (!annotation) {
        return res.status(404).json({ message: 'Annotation not found' });
      }

      // Broadcast to collaborators
      const message = {
        type: 'annotation_updated',
        data: annotation,
      };
      broadcastToVideoFile(annotation.videoFileId, null, message);

      res.json(annotation);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update annotation' });
    }
  });

  app.delete('/api/annotations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const annotation = await storage.getAnnotation(id);
      if (!annotation) {
        return res.status(404).json({ message: 'Annotation not found' });
      }

      const success = await storage.deleteAnnotation(id);
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete annotation' });
      }

      // Broadcast to collaborators
      const message = {
        type: 'annotation_deleted',
        data: { id, videoFileId: annotation.videoFileId },
      };
      broadcastToVideoFile(annotation.videoFileId, null, message);

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete annotation' });
    }
  });

  // Temporal events
  app.get('/api/temporal-events', async (req, res) => {
    try {
      const videoFileId = parseInt(req.query.videoFileId as string);
      const events = await storage.getTemporalEvents(videoFileId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch temporal events' });
    }
  });

  app.post('/api/temporal-events', async (req, res) => {
    try {
      const validated = insertTemporalEventSchema.parse(req.body);
      const event = await storage.createTemporalEvent(validated);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: 'Invalid temporal event data' });
    }
  });

  // Collaboration
  app.get('/api/collaborators/:videoFileId', async (req, res) => {
    try {
      const videoFileId = parseInt(req.params.videoFileId);
      const collaborators = await storage.getActiveCollaborators(videoFileId);
      res.json(collaborators);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch collaborators' });
    }
  });

  // Export data in FCN-Lecture Net format
  app.post('/api/export/:videoFileId', async (req, res) => {
    try {
      const videoFileId = parseInt(req.params.videoFileId);
      const videoFile = await storage.getVideoFile(videoFileId);
      if (!videoFile) {
        return res.status(404).json({ message: 'Video file not found' });
      }

      const annotations = await storage.getAnnotations(videoFileId);
      const temporalEvents = await storage.getTemporalEvents(videoFileId);

      // Format data for FCN-Lecture Net
      const exportData = {
        video_metadata: {
          filename: videoFile.originalName,
          duration: videoFile.duration,
          total_frames: videoFile.totalFrames,
          resolution: videoFile.resolution,
        },
        annotations: annotations.map(ann => ({
          frame_number: ann.frameNumber,
          annotation_type: ann.annotationType,
          tool_type: ann.toolType,
          coordinates: ann.coordinates,
          label: ann.label,
          confidence: ann.confidence,
        })),
        temporal_events: temporalEvents.map(event => ({
          event_type: event.eventType,
          frame_number: event.frameNumber,
          timestamp: event.timestamp,
          metadata: event.metadata,
        })),
        export_metadata: {
          exported_at: new Date().toISOString(),
          total_annotations: annotations.length,
          total_events: temporalEvents.length,
        },
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${videoFile.originalName}_annotations.json"`);
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to export data' });
    }
  });

  return httpServer;
}
