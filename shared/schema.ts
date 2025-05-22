import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("annotator"), // annotator, lead_annotator, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  courseName: text("course_name"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").notNull().default("active"), // active, completed, archived
});

export const videoFiles = pgTable("video_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(),
  duration: real("duration"), // in seconds
  totalFrames: integer("total_frames"),
  resolution: text("resolution"), // e.g., "1920x1080"
  fileSize: integer("file_size"), // in bytes
  status: text("status").notNull().default("pending"), // pending, processing, ready, completed
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const annotations = pgTable("annotations", {
  id: serial("id").primaryKey(),
  videoFileId: integer("video_file_id").notNull(),
  frameNumber: integer("frame_number").notNull(),
  annotationType: text("annotation_type").notNull(), // handwritten-text, mathematical-notation, diagram, background, erasure-region
  toolType: text("tool_type").notNull(), // bounding-box, polygon, freehand
  coordinates: jsonb("coordinates").notNull(), // Array of points or bbox coordinates
  label: text("label"),
  confidence: real("confidence"),
  notes: text("notes"),
  annotatedBy: integer("annotated_by").notNull(),
  annotatedAt: timestamp("annotated_at").defaultNow().notNull(),
  isValidated: boolean("is_validated").default(false),
  validatedBy: integer("validated_by"),
  validatedAt: timestamp("validated_at"),
});

export const temporalEvents = pgTable("temporal_events", {
  id: serial("id").primaryKey(),
  videoFileId: integer("video_file_id").notNull(),
  eventType: text("event_type").notNull(), // erasure, segment_start, segment_end
  frameNumber: integer("frame_number").notNull(),
  timestamp: real("timestamp").notNull(), // in seconds
  metadata: jsonb("metadata"), // Additional event-specific data
  detectedBy: integer("detected_by").notNull(),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
});

export const collaborationSessions = pgTable("collaboration_sessions", {
  id: serial("id").primaryKey(),
  videoFileId: integer("video_file_id").notNull(),
  userId: integer("user_id").notNull(),
  currentFrame: integer("current_frame"),
  isActive: boolean("is_active").default(true),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  videoFiles: many(videoFiles),
  annotations: many(annotations),
  temporalEvents: many(temporalEvents),
  collaborationSessions: many(collaborationSessions),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  createdBy: one(users, { fields: [projects.createdBy], references: [users.id] }),
  videoFiles: many(videoFiles),
}));

export const videoFilesRelations = relations(videoFiles, ({ one, many }) => ({
  project: one(projects, { fields: [videoFiles.projectId], references: [projects.id] }),
  uploadedBy: one(users, { fields: [videoFiles.uploadedBy], references: [users.id] }),
  annotations: many(annotations),
  temporalEvents: many(temporalEvents),
  collaborationSessions: many(collaborationSessions),
}));

export const annotationsRelations = relations(annotations, ({ one }) => ({
  videoFile: one(videoFiles, { fields: [annotations.videoFileId], references: [videoFiles.id] }),
  annotatedBy: one(users, { fields: [annotations.annotatedBy], references: [users.id] }),
  validatedBy: one(users, { fields: [annotations.validatedBy], references: [users.id] }),
}));

export const temporalEventsRelations = relations(temporalEvents, ({ one }) => ({
  videoFile: one(videoFiles, { fields: [temporalEvents.videoFileId], references: [videoFiles.id] }),
  detectedBy: one(users, { fields: [temporalEvents.detectedBy], references: [users.id] }),
}));

export const collaborationSessionsRelations = relations(collaborationSessions, ({ one }) => ({
  videoFile: one(videoFiles, { fields: [collaborationSessions.videoFileId], references: [videoFiles.id] }),
  user: one(users, { fields: [collaborationSessions.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertVideoFileSchema = createInsertSchema(videoFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertAnnotationSchema = createInsertSchema(annotations).omit({
  id: true,
  annotatedAt: true,
  validatedAt: true,
});

export const insertTemporalEventSchema = createInsertSchema(temporalEvents).omit({
  id: true,
  detectedAt: true,
});

export const insertCollaborationSessionSchema = createInsertSchema(collaborationSessions).omit({
  id: true,
  lastActivity: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type VideoFile = typeof videoFiles.$inferSelect;
export type InsertVideoFile = z.infer<typeof insertVideoFileSchema>;
export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;
export type TemporalEvent = typeof temporalEvents.$inferSelect;
export type InsertTemporalEvent = z.infer<typeof insertTemporalEventSchema>;
export type CollaborationSession = typeof collaborationSessions.$inferSelect;
export type InsertCollaborationSession = z.infer<typeof insertCollaborationSessionSchema>;
