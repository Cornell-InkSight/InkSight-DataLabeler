# InkSight AI - Data Labeling Tool

**A specialized annotation platform for STEM lecture videos designed to create high-quality training data for FCN-Lecture Net models.**

Project Proposal can be accessed [here](https://www.overleaf.com/read/cskygfzxhmyf#7d0297), as well as [Project Report](https://www.overleaf.com/read/jbhskcfcwytt#9a4cd7) and the deployed [Demo](https://inksight-data-labeler.replit.app/).

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

The tool integrates with the InkSight AI note-taking ecosystem, providing the labeled data needed to improve handwriting recognition and mathematical notation detection in STEM education.

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