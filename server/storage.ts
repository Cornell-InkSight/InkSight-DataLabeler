import { 
  users, projects, videoFiles, annotations, temporalEvents, collaborationSessions,
  type User, type InsertUser, type Project, type InsertProject,
  type VideoFile, type InsertVideoFile, type Annotation, type InsertAnnotation,
  type TemporalEvent, type InsertTemporalEvent, 
  type CollaborationSession, type InsertCollaborationSession
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project management
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined>;

  // Video file management
  getVideoFiles(projectId?: number): Promise<VideoFile[]>;
  getVideoFile(id: number): Promise<VideoFile | undefined>;
  createVideoFile(videoFile: InsertVideoFile): Promise<VideoFile>;
  updateVideoFile(id: number, updates: Partial<VideoFile>): Promise<VideoFile | undefined>;

  // Annotation management
  getAnnotations(videoFileId: number, frameNumber?: number): Promise<Annotation[]>;
  getAnnotation(id: number): Promise<Annotation | undefined>;
  createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;
  updateAnnotation(id: number, updates: Partial<Annotation>): Promise<Annotation | undefined>;
  deleteAnnotation(id: number): Promise<boolean>;

  // Temporal event management
  getTemporalEvents(videoFileId: number): Promise<TemporalEvent[]>;
  createTemporalEvent(event: InsertTemporalEvent): Promise<TemporalEvent>;

  // Collaboration management
  getActiveCollaborators(videoFileId: number): Promise<CollaborationSession[]>;
  createOrUpdateCollaborationSession(session: InsertCollaborationSession): Promise<CollaborationSession>;
  updateCollaborationFrame(sessionId: number, frameNumber: number): Promise<void>;
  deactivateCollaborationSession(sessionId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const [project] = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  async getVideoFiles(projectId?: number): Promise<VideoFile[]> {
    if (projectId) {
      return await db.select().from(videoFiles)
        .where(eq(videoFiles.projectId, projectId))
        .orderBy(desc(videoFiles.uploadedAt));
    }
    return await db.select().from(videoFiles).orderBy(desc(videoFiles.uploadedAt));
  }

  async getVideoFile(id: number): Promise<VideoFile | undefined> {
    const [videoFile] = await db.select().from(videoFiles).where(eq(videoFiles.id, id));
    return videoFile || undefined;
  }

  async createVideoFile(insertVideoFile: InsertVideoFile): Promise<VideoFile> {
    const [videoFile] = await db.insert(videoFiles).values(insertVideoFile).returning();
    return videoFile;
  }

  async updateVideoFile(id: number, updates: Partial<VideoFile>): Promise<VideoFile | undefined> {
    const [videoFile] = await db.update(videoFiles)
      .set(updates)
      .where(eq(videoFiles.id, id))
      .returning();
    return videoFile || undefined;
  }

  async getAnnotations(videoFileId: number, frameNumber?: number): Promise<Annotation[]> {
    if (frameNumber !== undefined) {
      return await db.select().from(annotations)
        .where(and(
          eq(annotations.videoFileId, videoFileId),
          eq(annotations.frameNumber, frameNumber)
        ))
        .orderBy(desc(annotations.annotatedAt));
    }
    return await db.select().from(annotations)
      .where(eq(annotations.videoFileId, videoFileId))
      .orderBy(asc(annotations.frameNumber), desc(annotations.annotatedAt));
  }

  async getAnnotation(id: number): Promise<Annotation | undefined> {
    const [annotation] = await db.select().from(annotations).where(eq(annotations.id, id));
    return annotation || undefined;
  }

  async createAnnotation(insertAnnotation: InsertAnnotation): Promise<Annotation> {
    const [annotation] = await db.insert(annotations).values(insertAnnotation).returning();
    return annotation;
  }

  async updateAnnotation(id: number, updates: Partial<Annotation>): Promise<Annotation | undefined> {
    const [annotation] = await db.update(annotations)
      .set(updates)
      .where(eq(annotations.id, id))
      .returning();
    return annotation || undefined;
  }

  async deleteAnnotation(id: number): Promise<boolean> {
    const result = await db.delete(annotations).where(eq(annotations.id, id));
    return result.rowCount > 0;
  }

  async getTemporalEvents(videoFileId: number): Promise<TemporalEvent[]> {
    return await db.select().from(temporalEvents)
      .where(eq(temporalEvents.videoFileId, videoFileId))
      .orderBy(asc(temporalEvents.timestamp));
  }

  async createTemporalEvent(insertEvent: InsertTemporalEvent): Promise<TemporalEvent> {
    const [event] = await db.insert(temporalEvents).values(insertEvent).returning();
    return event;
  }

  async getActiveCollaborators(videoFileId: number): Promise<CollaborationSession[]> {
    return await db.select().from(collaborationSessions)
      .where(and(
        eq(collaborationSessions.videoFileId, videoFileId),
        eq(collaborationSessions.isActive, true)
      ))
      .orderBy(desc(collaborationSessions.lastActivity));
  }

  async createOrUpdateCollaborationSession(insertSession: InsertCollaborationSession): Promise<CollaborationSession> {
    // First try to find existing session
    const [existingSession] = await db.select().from(collaborationSessions)
      .where(and(
        eq(collaborationSessions.videoFileId, insertSession.videoFileId),
        eq(collaborationSessions.userId, insertSession.userId)
      ));

    if (existingSession) {
      const [updatedSession] = await db.update(collaborationSessions)
        .set({
          currentFrame: insertSession.currentFrame,
          isActive: true,
          lastActivity: new Date(),
        })
        .where(eq(collaborationSessions.id, existingSession.id))
        .returning();
      return updatedSession;
    } else {
      const [newSession] = await db.insert(collaborationSessions).values(insertSession).returning();
      return newSession;
    }
  }

  async updateCollaborationFrame(sessionId: number, frameNumber: number): Promise<void> {
    await db.update(collaborationSessions)
      .set({
        currentFrame: frameNumber,
        lastActivity: new Date(),
      })
      .where(eq(collaborationSessions.id, sessionId));
  }

  async deactivateCollaborationSession(sessionId: number): Promise<void> {
    await db.update(collaborationSessions)
      .set({ isActive: false })
      .where(eq(collaborationSessions.id, sessionId));
  }
}

export const storage = new DatabaseStorage();
