# InkSight Data Labeling Tool

**A specialized annotation platform for STEM lecture videos designed to create high-quality training data for FCN-Lecture Net models.**

## What it does

The InkSight Data Labeling Tool enables researchers and educators to efficiently annotate lecture videos with frame-level precision. It's specifically designed for STEM education content, supporting the annotation of handwritten text, mathematical notation, diagrams, background elements, and erasure regions.

## Key Features

- **Frame-by-Frame Annotation**: Precise video annotation with multiple drawing tools (bounding boxes, polygons, freehand)
- **Real-Time Collaboration**: Multiple annotators can work on the same video simultaneously with live updates
- **Quality Control**: Built-in validation workflow with role-based access (annotator, lead annotator, admin)
- **Export for AI Training**: Generates FCN-Lecture Net compatible training data with quality metrics
- **Project Management**: Organize annotation work by course, topic, or research project

## Who it's for

- **Researchers** developing AI models for educational content analysis
- **Educational institutions** creating accessible learning materials
- **Data scientists** working on handwriting recognition and mathematical notation detection
- **Content creators** preparing lecture videos for AI-enhanced note-taking systems

## How it works

1. **Upload** lecture videos to organized projects
2. **Annotate** frame-by-frame using specialized tools for different content types
3. **Collaborate** with team members in real-time annotation sessions
4. **Validate** annotations through quality control workflows
5. **Export** training data in formats ready for AI model development

## Diagram Labeling Workflow

### **Annotation Tools for Diagrams**
- **🔲 Bounding Box**: Draw rectangles around simple diagrams (charts, graphs, tables)
- **📦 Polygon**: Create complex shapes for irregular diagrams (custom shapes, organic forms)
- **🎨 Freehand**: Paint-style annotation for intricate diagrams (hand-drawn sketches, complex illustrations)

### **Color-Coded Classification System**
- **🔵 Diagrams**: Blue highlighting for all visual elements (graphs, charts, illustrations)
- **🟡 Handwritten Text**: Amber for written notes and explanations
- **🟢 Mathematical Notation**: Emerald for equations, symbols, and formulas
- **⚫ Background**: Gray for whiteboard, slide content, static elements
- **🔴 Erasure Regions**: Red for areas where content was removed

### **Step-by-Step Diagram Annotation Process**

1. **Navigate to Frame**: Use timeline scrubber or arrow keys to find frames containing diagrams
2. **Select Annotation Type**: Choose "Diagram/Figure" from the content type panel
3. **Choose Drawing Tool**: 
   - Bounding box for rectangular diagrams (bar charts, simple graphs)
   - Polygon for complex shapes (clicking points to create vertices around irregular diagrams)
   - Freehand for tracing detailed outlines (hand-drawn sketches, organic shapes)
4. **Draw Annotation**: Click and drag (or trace) to capture the diagram boundaries with pixel precision
5. **Add Metadata**:
   - **Label**: Descriptive name (e.g., "velocity_vs_time_graph", "free_body_diagram", "molecular_structure")
   - **Confidence**: Rate annotation accuracy from 0.1 to 1.0 based on diagram clarity
   - **Notes**: Context and details (e.g., "Parabolic curve showing y = x²", "Force diagram with 3 vectors")

### **Coordinate Storage Formats**
The system captures different coordinate structures optimized for FCN-Lecture Net training:

```
Bounding Box: {x: 100, y: 50, width: 200, height: 150}
Polygon: {points: [{x: 100, y: 50}, {x: 300, y: 50}, {x: 200, y: 200}]}
Freehand: {path: [{x: 100, y: 50}, {x: 101, y: 51}, {x: 102, y: 53}...]}
```

### **Quality Control for Diagrams**
- **Real-time Validation**: Lead annotators review diagram classifications for accuracy
- **Consistency Checking**: Ensures proper distinction between diagrams, handwritten text, and mathematical notation
- **Inter-annotator Agreement**: Quality metrics track diagram annotation consistency across team members
- **Validation Pipeline**: Only validated diagram annotations are included in training data exports

### **Collaboration Features**
- **Live Updates**: Multiple annotators see diagram annotations appear instantly as they're created
- **Frame Coordination**: Team members can work on different frames simultaneously without conflicts
- **Visual Indicators**: Blue highlighting shows active diagram annotations to all collaborators
- **Annotation History**: Complete tracking of who created and validated each diagram annotation

The tool integrates seamlessly with the InkSight AI note-taking ecosystem, providing the labeled data needed to improve handwriting recognition and mathematical notation detection in STEM education.

## How to Run Locally

### Prerequisites
- **Node.js 18+** and npm
- **PostgreSQL 14+** database
- **Git** for cloning the repository

### Quick Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd inksight-data-labeling-tool
   npm install
   ```

2. **Database Setup**
   ```bash
   # Create a PostgreSQL database
   createdb inksight_labeling
   
   # Set your database connection
   export DATABASE_URL="postgresql://username:password@localhost:5432/inksight_labeling"
   ```

3. **Initialize Database Schema**
   ```bash
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open http://localhost:5000 in your browser
   - Click "🎬 Live Demo" to see the complete workflow

### Environment Variables

Create a `.env` file in the root directory:
```
DATABASE_URL=postgresql://username:password@localhost:5432/inksight_labeling
NODE_ENV=development
```

### Demo Data (Optional)

To populate with sample data for testing:
```bash
# Access the demo endpoint
curl -X POST http://localhost:5000/api/demo/create-sample-data
```

### Production Deployment

For production deployment:
```bash
npm run build
npm start
```

The application runs both frontend and backend on the same port (5000) with integrated WebSocket support for real-time collaboration.