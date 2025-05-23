# Data Labeling Workflow - InkSight Tool

## End User Interaction Flow

### 1. **Project Setup & Video Upload**
```
User → Upload Video → Video Processing → Ready for Annotation
```

**User Experience:**
- Navigate to "Upload Data" section
- Select or create a project (e.g., "Calculus I - Spring 2024")
- Upload lecture video files (MP4, AVI, MOV supported)
- System processes video to extract frames and metadata
- Video status changes: `pending` → `processing` → `ready`

### 2. **Annotation Workspace Entry**
```
User → Select Video → Enter Workspace → Frame-by-Frame Annotation
```

**User Experience:**
- Click on a ready video from the sidebar
- Enter full annotation workspace with:
  - Video player (left side)
  - Canvas overlay for drawing
  - Tool palette (right side)
  - Timeline scrubber (bottom)
  - Collaboration panel (optional)

### 3. **Frame-by-Frame Annotation Process**

#### **Step 3a: Navigation**
- Use timeline scrubber to jump to specific frames
- Arrow keys for frame-by-frame navigation
- Play/pause for context understanding
- Zoom in/out on specific areas

#### **Step 3b: Tool Selection**
```
Annotation Types:          Drawing Tools:
• Handwritten Text        • Bounding Box (rectangles)
• Mathematical Notation   • Polygon (complex shapes)
• Diagram                 • Freehand (paint-style)
• Background              • Eraser (remove annotations)
• Erasure Region
```

#### **Step 3c: Drawing Process**
1. **Select annotation type** (e.g., "Mathematical Notation")
2. **Select drawing tool** (e.g., "Polygon")
3. **Draw on canvas** - coordinates auto-captured
4. **Add label** (e.g., "integral_symbol")
5. **Set confidence** (0.1 to 1.0 scale)
6. **Add notes** (optional context)
7. **Save annotation** - automatically stored to database

### 4. **Real-Time Collaboration**

**Multi-User Workflow:**
```
Annotator A (Frame 150) ← WebSocket → Annotator B (Frame 200)
    ↓                                         ↓
Live Updates                           Live Updates
    ↓                                         ↓
Database ← All Changes Synchronized → Database
```

**User Experience:**
- See other users' cursors in real-time
- Live annotation updates as they're created
- Frame synchronization (optional)
- Chat/comment system for coordination

### 5. **Quality Control & Validation**

**Lead Annotator Workflow:**
```
Annotation Created → Review Queue → Validate/Reject → Training Data
```

**User Experience:**
- Review annotations from team members
- Mark as validated or request changes
- Add feedback comments
- Track validation progress per project

## Design Decisions & Rationale

### **1. Frame-Based Storage (Not Time-Based)**
**Why:** FCN-Lecture Net requires pixel-perfect frame alignment for training. Time-based annotations can drift due to variable frame rates.

**Implementation:**
```javascript
// Each annotation tied to specific frame number
{
  frameNumber: 1502,           // Exact frame
  coordinates: {x: 245, y: 120, width: 180, height: 45},
  timestamp: 50.067            // Calculated from frame rate
}
```

### **2. JSONB Coordinate Storage**
**Why:** Different annotation types need different coordinate structures. JSONB provides flexibility while maintaining query performance.

**Examples:**
```javascript
// Bounding Box
coordinates: {x: 100, y: 50, width: 200, height: 100}

// Polygon
coordinates: {points: [{x: 100, y: 50}, {x: 300, y: 50}, {x: 200, y: 150}]}

// Freehand
coordinates: {path: [{x: 100, y: 50}, {x: 101, y: 51}, ...]}
```

### **3. Incremental Auto-Save**
**Why:** Prevents data loss during long annotation sessions. Every annotation action immediately saved.

**Implementation:**
```javascript
// Auto-save on every annotation action
const createAnnotation = useCallback(async (annotationData) => {
  const result = await apiRequest('POST', '/api/annotations', annotationData);
  // Immediately update UI and broadcast to collaborators
  broadcastToCollaborators({type: 'annotation_created', data: result});
}, []);
```

### **4. Role-Based Validation Pipeline**
**Why:** Ensures data quality for AI training. Prevents low-quality annotations from reaching training datasets.

**Workflow:**
```
Annotator → Creates → Lead Annotator → Validates → Admin → Exports
```

## Data Persistence Architecture

### **Database Storage Strategy**
```sql
-- Core annotation table with optimized indexes
CREATE TABLE annotations (
  id SERIAL PRIMARY KEY,
  video_file_id INTEGER NOT NULL,
  frame_number INTEGER NOT NULL,           -- Key for FCN training
  annotation_type VARCHAR(100) NOT NULL,   -- STEM-specific categories
  coordinates JSONB NOT NULL,              -- Flexible coordinate storage
  is_validated BOOLEAN DEFAULT FALSE,      -- Quality control flag
  annotated_at TIMESTAMP DEFAULT NOW()
);

-- Optimized indexes for fast retrieval
CREATE INDEX idx_annotations_video_frame ON annotations(video_file_id, frame_number);
CREATE INDEX idx_annotations_type ON annotations(annotation_type);
CREATE INDEX idx_annotations_validated ON annotations(is_validated);
```

### **Real-Time Data Flow**
```
User Action → React State → API Call → Database → WebSocket Broadcast → Other Users
     ↓              ↓            ↓          ↓              ↓              ↓
  Canvas Draw  → Auto-save → PostgreSQL → Real-time → Live Updates → UI Refresh
```

## Efficiency Optimizations for Maximum Training Data

### **1. Smart Frame Suggestions**
**Current:** Manual frame selection
**Optimization:** AI-powered frame recommendation

```javascript
// Suggest frames with high information density
const suggestFrames = async (videoId) => {
  // Analyze frame differences to find writing activity
  const keyFrames = await detectWritingActivity(videoId);
  return keyFrames.filter(frame => frame.activityScore > 0.7);
};
```

### **2. Semi-Automatic Annotation**
**Current:** Full manual annotation
**Optimization:** Pre-annotation with AI models

```javascript
// Use existing models to pre-annotate, human validates/corrects
const preAnnotate = async (frameData) => {
  const suggestions = await existingModel.predict(frameData);
  return suggestions.map(s => ({
    ...s,
    confidence: s.confidence * 0.8,  // Reduce confidence for review
    needsValidation: true
  }));
};
```

### **3. Batch Annotation Tools**
**Current:** One annotation at a time
**Optimization:** Multi-frame batch operations

```javascript
// Apply same annotation across multiple frames
const batchAnnotate = (startFrame, endFrame, annotationTemplate) => {
  for (let frame = startFrame; frame <= endFrame; frame++) {
    createAnnotation({
      ...annotationTemplate,
      frameNumber: frame,
      confidence: annotationTemplate.confidence * 0.9  // Slightly lower for batch
    });
  }
};
```

### **4. Active Learning Integration**
**Current:** Random annotation selection
**Optimization:** Prioritize high-impact frames

```javascript
// Focus on frames that will improve model performance most
const prioritizeFrames = async (videoId) => {
  const modelUncertainty = await calculateModelUncertainty(videoId);
  const annotationGaps = await findAnnotationGaps(videoId);
  
  return combineScores(modelUncertainty, annotationGaps)
    .sort((a, b) => b.priority - a.priority);
};
```

### **5. Keyboard Shortcuts & Workflow Optimization**
```javascript
// Speed up annotation with hotkeys
const shortcuts = {
  'h': () => setAnnotationType('handwritten-text'),
  'm': () => setAnnotationType('mathematical-notation'),
  'd': () => setAnnotationType('diagram'),
  'b': () => setTool('bounding-box'),
  'p': () => setTool('polygon'),
  'ArrowRight': () => nextFrame(),
  'ArrowLeft': () => prevFrame(),
  'Space': () => togglePlayPause(),
  'Enter': () => completeAnnotation(),
  'Escape': () => cancelAnnotation()
};
```

### **6. Quality-Based Sampling**
**Current:** Annotate everything
**Optimization:** Focus on quality over quantity

```javascript
// Skip redundant frames, focus on unique content
const intelligentSampling = (videoFrames) => {
  return videoFrames.filter((frame, index) => {
    const similarity = calculateSimilarity(frame, videoFrames[index - 1]);
    return similarity < 0.95;  // Only annotate if significantly different
  });
};
```

## Projected Efficiency Gains

With these optimizations, the tool could achieve:

- **3x faster annotation** through smart frame suggestions
- **5x more training data** through semi-automatic pre-annotation
- **2x better quality** through active learning prioritization
- **50% less manual work** through batch operations and shortcuts

This means a team that previously labeled 100 hours of video per month could potentially process 300+ hours with higher quality annotations, dramatically accelerating FCN-Lecture Net training data generation.