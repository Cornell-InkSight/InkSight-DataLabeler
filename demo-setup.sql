-- Demo data setup for InkSight Data Labeling Tool
-- This creates sample users, projects, and demonstrates the full workflow

-- Insert demo users
INSERT INTO users (username, email, password, role) VALUES
('demo_annotator', 'annotator@demo.com', 'hashed_password_123', 'annotator'),
('demo_lead', 'lead@demo.com', 'hashed_password_456', 'lead_annotator'),
('demo_admin', 'admin@demo.com', 'hashed_password_789', 'admin');

-- Insert demo project
INSERT INTO projects (name, description, course_name, created_by, status) VALUES
('Calculus I Lectures Demo', 'Sample STEM lecture annotations for FCN-Lecture Net training', 'Mathematics - Calculus I', 1, 'active');

-- This will be populated when we upload a demo video
SELECT 'Demo setup complete' as status;