# InkSight Data Labeling Tool

## Overview

InkSight is a specialized data labeling platform designed for STEM lecture videos and FCN-Lecture Net training data preparation. The application provides an annotation workspace where users can collaboratively label video content with different annotation types like handwritten text, mathematical notation, diagrams, and more.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket server for collaboration features
- **File Handling**: Multer for video file uploads

### Database Design
The application uses PostgreSQL as the primary database with the following core entities:
- **Users**: Authentication and role management (annotator, lead_annotator, admin)
- **Projects**: Organization of annotation work by course/topic
- **Video Files**: Storage of uploaded video content with metadata
- **Annotations**: Frame-specific annotations with coordinates and labels
- **Temporal Events**: Time-based events in videos
- **Collaboration Sessions**: Real-time collaboration tracking

## Key Components

### Video Player & Canvas System
- Custom video player with frame-by-frame navigation
- HTML5 Canvas overlay for annotation drawing
- Support for multiple annotation tools (bounding box, polygon, freehand)
- Timeline scrubbing with annotation visualization

### Annotation Tools
- **Bounding Box**: Rectangular region selection
- **Polygon**: Complex shape annotation
- **Freehand**: Paint-style annotation
- **Eraser**: Annotation removal tool

### Real-time Collaboration
- WebSocket-based real-time updates
- Live cursor tracking and frame synchronization
- Collaborative annotation sessions with user presence indicators

### File Management
- Video upload with processing pipeline
- File status tracking (pending, processing, ready, completed)
- Metadata extraction (duration, frames, resolution)

## Data Flow

1. **Video Upload**: Users upload video files which are processed and stored
2. **Project Assignment**: Videos are assigned to projects for organization
3. **Annotation Workflow**: 
   - Users navigate video frame-by-frame
   - Create annotations using various tools
   - Annotations are stored with frame coordinates
   - Real-time updates broadcast to collaborators
4. **Validation**: Lead annotators can validate annotations
5. **Export**: Completed annotations can be exported in various formats

## External Dependencies

### Database & Storage
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Type-safe database ORM
- **connect-pg-simple**: PostgreSQL session store

### UI & Styling
- **@radix-ui/***: Unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management

### Real-time Features
- **ws**: WebSocket server implementation
- **@tanstack/react-query**: Server state management

### File Processing
- **multer**: Multipart form data handling for file uploads

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- tsx for TypeScript execution in development
- Database migrations via Drizzle Kit

### Production
- Vite build for optimized frontend bundle
- esbuild for server-side TypeScript compilation
- Express serves both API and static files
- PostgreSQL database (configurable via DATABASE_URL)

### Infrastructure
- **Platform**: Replit with autoscale deployment
- **Database**: PostgreSQL 16 module
- **File Storage**: Local filesystem with uploads directory
- **WebSocket**: Integrated with HTTP server on same port

The application is designed to scale horizontally with stateless server architecture and database-backed session management. The real-time collaboration features use WebSocket connections that can be load-balanced across multiple server instances.