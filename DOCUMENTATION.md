# InkSight Data Labeling Tool - Technical Documentation

## Overview

The InkSight Data Labeling Tool is a specialized annotation platform designed for preparing training data for the FCN-Lecture Net model. This tool enables efficient labeling of STEM lecture videos, focusing on handwritten text, mathematical notation, diagrams, background elements, and erasure region detection.

## Table of Contents

1. [Full-Stack Architecture](#full-stack-architecture)
2. [Database Schema](#database-schema)
3. [Design Choices & Rationale](#design-choices--rationale)
4. [Output Data Format](#output-data-format)
5. [Cloud Storage Strategy](#cloud-storage-strategy)
6. [InkSight Data Pipeline Integration](#inksight-data-pipeline-integration)
7. [Deployment & Scaling](#deployment--scaling)

---

## Full-Stack Architecture

### Technology Stack

**Frontend (Client)**
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite with HMR for development
- **Real-time**: WebSocket client for collaboration

**Backend (Server)**
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket server for live collaboration
- **File Upload**: Multer for multipart form handling
- **Session Management**: express-session with PostgreSQL store

**Database & Storage**
- **Primary Database**: PostgreSQL 16 (Neon serverless)
- **ORM**: Drizzle with type-safe queries
- **Migration**: Drizzle Kit for schema management
- **File Storage**: Local filesystem with planned cloud migration

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Video Player│  │ Canvas Tool │  │ Sidebar     │       │
│  │             │  │             │  │             │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Timeline    │  │ Annotation  │  │ Collaboration│      │
│  │             │  │ Tools       │  │ Panel       │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ REST API    │  │ WebSocket   │  │ File Upload │       │
│  │ Routes      │  │ Server      │  │ Handler     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Storage     │  │ Session     │  │ Real-time   │       │
│  │ Interface   │  │ Management  │  │ Broadcast   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                         │
├─────────────────────────────────────────────────────────────┤
│  users │ projects │ video_files │ annotations              │
│  temporal_events │ collaboration_sessions                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Entities

#### 1. Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'annotator',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Manages user authentication and role-based access control.

**Roles**:
- `annotator`: Basic annotation privileges
- `lead_annotator`: Can validate annotations from others
- `admin`: Full system access and project management

#### 2. Projects Table
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  course_name VARCHAR(255),
  created_by INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Organizes annotation work by course or research topic.

#### 3. Video Files Table
```sql
CREATE TABLE video_files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  duration REAL,
  total_frames INTEGER,
  resolution VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending',
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Stores video metadata and processing status.

**Status Values**:
- `pending`: Uploaded but not processed
- `processing`: Video analysis in progress
- `ready`: Available for annotation
- `completed`: All annotations finished

#### 4. Annotations Table
```sql
CREATE TABLE annotations (
  id SERIAL PRIMARY KEY,
  video_file_id INTEGER REFERENCES video_files(id),
  frame_number INTEGER NOT NULL,
  annotation_type VARCHAR(100) NOT NULL,
  tool_type VARCHAR(50) NOT NULL,
  coordinates JSONB NOT NULL,
  label VARCHAR(255),
  confidence REAL,
  notes TEXT,
  annotated_by INTEGER REFERENCES users(id),
  annotated_at TIMESTAMP DEFAULT NOW(),
  is_validated BOOLEAN DEFAULT FALSE,
  validated_by INTEGER REFERENCES users(id),
  validated_at TIMESTAMP
);
```

**Purpose**: Core annotation data with frame-level precision.

**Annotation Types**:
- `handwritten_text`: Mathematical equations, notes
- `mathematical_notation`: Symbols, formulas
- `diagram`: Charts, graphs, illustrations
- `background`: Whiteboard, slides, static content
- `erasure_region`: Areas where content was erased

**Tool Types**:
- `bounding_box`: Rectangular regions
- `polygon`: Complex shapes
- `freehand`: Paint-style annotations

#### 5. Temporal Events Table
```sql
CREATE TABLE temporal_events (
  id SERIAL PRIMARY KEY,
  video_file_id INTEGER REFERENCES video_files(id),
  event_type VARCHAR(100) NOT NULL,
  frame_number INTEGER NOT NULL,
  timestamp REAL NOT NULL,
  metadata JSONB,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Tracks time-based events in lecture videos.

**Event Types**:
- `writing_start`: Beginning of writing activity
- `writing_end`: End of writing activity
- `erasure_event`: Content erasure detected
- `slide_change`: Transition between slides
- `gesture_annotation`: Hand gestures or pointing

#### 6. Collaboration Sessions Table
```sql
CREATE TABLE collaboration_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  video_file_id INTEGER REFERENCES video_files(id),
  current_frame INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Enables real-time collaborative annotation.

### Database Relationships

```
users (1) ──── (many) projects
users (1) ──── (many) video_files
users (1) ──── (many) annotations
users (1) ──── (many) collaboration_sessions

projects (1) ──── (many) video_files
video_files (1) ──── (many) annotations
video_files (1) ──── (many) temporal_events
video_files (1) ──── (many) collaboration_sessions
```

---

## Design Choices & Rationale

### 1. **PostgreSQL as Primary Database**
**Choice**: PostgreSQL with JSONB for coordinate storage
**Rationale**: 
- Strong ACID compliance for data integrity
- JSONB provides flexible coordinate storage while maintaining query performance
- Built-in array support for complex annotation shapes
- Excellent TypeScript integration via Drizzle ORM

### 2. **Frame-Based Annotation System**
**Choice**: Store annotations per video frame rather than time-based
**Rationale**:
- Frame precision essential for FCN-Lecture Net training
- Consistent annotation positioning regardless of playback speed
- Enables precise temporal analysis of writing patterns
- Supports variable frame rate videos

### 3. **Real-Time Collaboration via WebSocket**
**Choice**: WebSocket server integrated with HTTP server
**Rationale**:
- Immediate updates for collaborative annotation sessions
- Prevents annotation conflicts between multiple users
- Live cursor tracking enhances team coordination
- Scales horizontally with stateless architecture

### 4. **JSONB Coordinate Storage**
**Choice**: Store annotation coordinates as JSONB rather than separate tables
**Rationale**:
- Flexible schema supports different annotation types
- High performance for coordinate-based queries
- Reduces join complexity for annotation retrieval
- Native PostgreSQL indexing on JSONB properties

### 5. **Role-Based Access Control**
**Choice**: Three-tier role system (annotator, lead_annotator, admin)
**Rationale**:
- Enforces quality control through validation workflow
- Protects sensitive project data
- Enables delegation of annotation tasks
- Supports academic hierarchy in research settings

### 6. **Modular Component Architecture**
**Choice**: Separate components for video player, canvas, tools, timeline
**Rationale**:
- Independent development and testing of features
- Reusable components across different views
- Easier maintenance and debugging
- Supports future feature expansion

---

## Output Data Format

### FCN-Lecture Net Training Format

The annotation data is exported in a format optimized for FCN-Lecture Net training:

```json
{
  "video_metadata": {
    "video_id": 123,
    "original_name": "lecture_01_intro_calculus.mp4",
    "duration": 3600.5,
    "total_frames": 90012,
    "resolution": "1920x1080",
    "course": "Calculus I",
    "project": "Fall 2024 Math Lectures"
  },
  "annotations": [
    {
      "frame_number": 150,
      "timestamp": 5.0,
      "regions": [
        {
          "id": "ann_001",
          "type": "handwritten_text",
          "tool": "bounding_box",
          "coordinates": {
            "x": 245,
            "y": 120,
            "width": 180,
            "height": 45
          },
          "label": "derivative_equation",
          "confidence": 0.95,
          "validated": true,
          "annotator": "user_123",
          "validator": "lead_456"
        },
        {
          "id": "ann_002",
          "type": "mathematical_notation",
          "tool": "polygon",
          "coordinates": {
            "points": [
              {"x": 340, "y": 200},
              {"x": 380, "y": 200},
              {"x": 385, "y": 230},
              {"x": 335, "y": 235}
            ]
          },
          "label": "integral_symbol",
          "confidence": 0.88,
          "validated": true
        }
      ]
    }
  ],
  "temporal_events": [
    {
      "event_type": "writing_start",
      "frame_number": 148,
      "timestamp": 4.93,
      "metadata": {
        "writing_tool": "marker",
        "estimated_duration": 2.1
      }
    }
  ],
  "export_metadata": {
    "exported_at": "2024-01-15T10:30:00Z",
    "export_version": "1.2",
    "total_annotations": 1247,
    "validated_annotations": 1205,
    "annotation_types": {
      "handwritten_text": 512,
      "mathematical_notation": 387,
      "diagram": 234,
      "background": 89,
      "erasure_region": 25
    }
  }
}
```

### Export Formats Supported

1. **JSON**: Full annotation data with metadata
2. **CSV**: Tabular format for statistical analysis
3. **COCO Format**: Computer vision standard for object detection
4. **Custom FCN Format**: Optimized for FCN-Lecture Net training

### Data Validation

- **Coordinate Validation**: Ensures all coordinates are within video bounds
- **Frame Validation**: Verifies frame numbers exist within video range
- **Type Validation**: Checks annotation types against predefined categories
- **Quality Metrics**: Calculates inter-annotator agreement scores

---

## Cloud Storage Strategy

### Recommended Cloud Architecture

#### 1. **AWS S3 for Video Storage**
```
s3://inksight-video-storage/
├── raw-videos/
│   ├── project-123/
│   │   ├── lecture-001.mp4
│   │   └── lecture-002.mp4
├── processed-videos/
│   ├── project-123/
│   │   ├── lecture-001/
│   │   │   ├── frames/
│   │   │   ├── thumbnails/
│   │   │   └── metadata.json
└── exports/
    ├── project-123/
    │   ├── annotations-v1.2.json
    │   └── training-data.zip
```

#### 2. **Database Migration Strategy**
**Current**: Local PostgreSQL
**Target**: Amazon RDS PostgreSQL or Google Cloud SQL

```typescript
// Database configuration for cloud deployment
export const dbConfig = {
  production: {
    host: process.env.DB_HOST, // RDS endpoint
    port: 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  },
  development: {
    connectionString: process.env.DATABASE_URL
  }
};
```

#### 3. **CDN Integration**
**CloudFront Distribution** for video delivery:
- Origin: S3 bucket
- Caching: 24-hour TTL for video files
- Geographic distribution for global access
- Signed URLs for secure video access

#### 4. **Cost Optimization**
- **S3 Intelligent Tiering**: Automatic cost optimization
- **Lifecycle Policies**: Move old videos to Glacier
- **CloudFront**: Reduce S3 transfer costs
- **RDS Reserved Instances**: Predictable database costs

### Implementation Steps

1. **Phase 1**: S3 bucket setup and file upload migration
2. **Phase 2**: RDS database migration with zero downtime
3. **Phase 3**: CloudFront CDN configuration
4. **Phase 4**: Monitoring and cost optimization

---

## InkSight Data Pipeline Integration

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                InkSight MVP (Existing)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Note Taking │  │ AI Models   │  │ User        │       │
│  │ Interface   │  │ (FCN-Net)   │  │ Dashboard   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ Training Data
                              │
┌─────────────────────────────────────────────────────────────┐
│              Data Pipeline (New)                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Data        │  │ Model       │  │ Quality     │       │
│  │ Processing  │  │ Training    │  │ Validation  │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ Labeled Data
                              │
┌─────────────────────────────────────────────────────────────┐
│           Data Labeling Tool (This Project)                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Video       │  │ Annotation  │  │ Export      │       │
│  │ Upload      │  │ Workspace   │  │ System      │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Integration

#### 1. **Annotation Export to Training Pipeline**
```typescript
interface TrainingDataExport {
  export_id: string;
  project_id: number;
  export_timestamp: string;
  annotations: AnnotationData[];
  quality_metrics: {
    inter_annotator_agreement: number;
    validation_coverage: number;
    annotation_density: number;
  };
}

// Export function for FCN-Lecture Net training
export async function exportForTraining(projectId: number): Promise<TrainingDataExport> {
  const annotations = await storage.getAnnotations(projectId);
  const qualityMetrics = calculateQualityMetrics(annotations);
  
  return {
    export_id: generateExportId(),
    project_id: projectId,
    export_timestamp: new Date().toISOString(),
    annotations: formatForFCN(annotations),
    quality_metrics: qualityMetrics
  };
}
```

#### 2. **API Integration Points**
```typescript
// REST API endpoints for integration
app.post('/api/exports/training-data/:projectId', async (req, res) => {
  const trainingData = await exportForTraining(req.params.projectId);
  
  // Trigger training pipeline
  await triggerModelTraining(trainingData);
  
  res.json({ export_id: trainingData.export_id });
});

app.get('/api/model-performance/:exportId', async (req, res) => {
  const performance = await getModelPerformance(req.params.exportId);
  res.json(performance);
});
```

#### 3. **Webhook System for Continuous Integration**
```typescript
interface WebhookConfig {
  url: string;
  events: string[];
  secret: string;
}

// Webhook triggers for InkSight MVP
const webhookEvents = [
  'annotation.validated',
  'project.completed',
  'export.ready',
  'model.trained'
];

export function triggerWebhook(event: string, data: any) {
  // Send webhook to InkSight MVP for model updates
  fetch(INKSIGHT_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': generateSignature(data)
    },
    body: JSON.stringify({ event, data })
  });
}
```

### Model Training Integration

#### 1. **Training Data Format**
The exported data follows FCN-Lecture Net specifications:
- **Frame-level annotations** with pixel coordinates
- **Temporal sequences** for handwriting dynamics
- **Multi-class labels** for different content types
- **Quality metrics** for training validation

#### 2. **Feedback Loop**
```typescript
interface ModelFeedback {
  model_version: string;
  accuracy_metrics: {
    overall: number;
    by_annotation_type: Record<string, number>;
  };
  improvement_suggestions: {
    annotation_type: string;
    suggested_samples: number;
  }[];
}

// Receive feedback from trained models
app.post('/api/model-feedback', async (req, res) => {
  const feedback: ModelFeedback = req.body;
  
  // Update annotation priorities based on model feedback
  await updateAnnotationPriorities(feedback);
  
  res.json({ status: 'feedback_processed' });
});
```

#### 3. **Continuous Learning Pipeline**
- **Weekly exports** of new annotations
- **A/B testing** of model versions
- **Performance tracking** across annotation types
- **Active learning** suggestions for new annotations

---

## Deployment & Scaling

### Current Deployment (Replit)
- **Platform**: Replit with autoscale
- **Database**: PostgreSQL module
- **File Storage**: Local filesystem
- **WebSocket**: Integrated with HTTP server

### Production Deployment Strategy

#### 1. **Cloud Infrastructure (AWS)**
```yaml
# docker-compose.yml for production
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${RDS_CONNECTION_STRING}
      - S3_BUCKET=${S3_BUCKET_NAME}
      - REDIS_URL=${REDIS_CONNECTION_STRING}
    volumes:
      - ./uploads:/app/uploads

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
```

#### 2. **Scaling Considerations**
- **Horizontal Scaling**: Stateless architecture supports multiple instances
- **Database Scaling**: Read replicas for annotation queries
- **File Storage**: S3 for unlimited video storage
- **WebSocket Scaling**: Redis adapter for multi-instance coordination

#### 3. **Monitoring & Analytics**
```typescript
// Application performance monitoring
import { Logger } from 'winston';
import { metrics } from 'prometheus-client';

export const annotationMetrics = {
  annotationsCreated: new metrics.Counter({
    name: 'annotations_created_total',
    help: 'Total number of annotations created'
  }),
  
  annotationLatency: new metrics.Histogram({
    name: 'annotation_creation_duration_seconds',
    help: 'Time to create an annotation'
  }),
  
  activeCollaborators: new metrics.Gauge({
    name: 'active_collaborators',
    help: 'Number of active collaboration sessions'
  })
};
```

### Security Considerations

1. **Authentication**: JWT tokens with role-based access
2. **Data Encryption**: TLS 1.3 for all communications
3. **File Security**: Signed URLs for video access
4. **Database Security**: Connection encryption and credential rotation
5. **GDPR Compliance**: User data anonymization and deletion capabilities

---

## Conclusion

The InkSight Data Labeling Tool provides a comprehensive solution for creating high-quality training data for FCN-Lecture Net models. The architecture prioritizes scalability, data integrity, and seamless integration with the existing InkSight ecosystem. 

The modular design ensures the system can evolve with changing requirements while maintaining backward compatibility and data consistency. The cloud migration strategy provides a clear path for scaling to handle large-scale annotation projects across multiple institutions.

For questions or technical support, refer to the API documentation or contact the development team.