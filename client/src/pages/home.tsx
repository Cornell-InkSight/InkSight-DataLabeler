import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, Upload, BarChart3, Download, Video, Clock, Users } from "lucide-react";

interface Project {
  id: number;
  name: string;
  description: string;
  courseName: string;
  status: string;
  createdAt: string;
}

interface VideoFile {
  id: number;
  projectId: number;
  originalName: string;
  duration: number;
  status: string;
  uploadedAt: string;
}

export default function Home() {
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: videoFiles, isLoading: filesLoading } = useQuery<VideoFile[]>({
    queryKey: ["/api/video-files"],
  });

  const currentProject = projects?.[0];
  const projectFiles = videoFiles?.filter(file => file.projectId === currentProject?.id) || [];
  
  const completedFiles = projectFiles.filter(file => file.status === "completed").length;
  const inProgressFiles = projectFiles.filter(file => file.status === "processing" || file.status === "ready").length;
  const pendingFiles = projectFiles.filter(file => file.status === "pending").length;
  
  const progressPercentage = projectFiles.length > 0 ? (completedFiles / projectFiles.length) * 100 : 0;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (projectsLoading || filesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading InkSight...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">InkSight</h1>
              <p className="text-sm text-slate-500">Data Labeling Tool for STEM Education</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link href="/upload">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload Videos
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Project Overview */}
        {currentProject && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{currentProject.name}</h2>
                <p className="text-slate-600">{currentProject.courseName}</p>
              </div>
              <Badge variant={currentProject.status === "active" ? "default" : "secondary"}>
                {currentProject.status}
              </Badge>
            </div>

            {/* Progress Overview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Project Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Overall Completion</span>
                      <span className="font-medium">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{completedFiles}</div>
                      <div className="text-sm text-slate-600">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">{inProgressFiles}</div>
                      <div className="text-sm text-slate-600">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-500">{pendingFiles}</div>
                      <div className="text-sm text-slate-600">Pending</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/workspace/1">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Video className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900">Annotation Workspace</h3>
                <p className="text-sm text-slate-600 mt-1">Annotate lecture videos</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/upload">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Upload className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900">Upload Data</h3>
                <p className="text-sm text-slate-600 mt-1">Add new lecture videos</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 text-amber-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900">Progress Dashboard</h3>
                <p className="text-sm text-slate-600 mt-1">Track annotation progress</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/export">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Download className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900">Export Data</h3>
                <p className="text-sm text-slate-600 mt-1">Download training datasets</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Files */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Files</CardTitle>
          </CardHeader>
          <CardContent>
            {projectFiles.length === 0 ? (
              <div className="text-center py-8">
                <Video className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No video files uploaded yet</p>
                <Link href="/upload">
                  <Button className="mt-3">Upload your first video</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projectFiles.slice(0, 5).map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                        <Video className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{file.originalName}</p>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          {file.duration && (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>{formatDuration(file.duration)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={
                          file.status === "completed" ? "default" :
                          file.status === "ready" ? "secondary" :
                          file.status === "processing" ? "outline" : "destructive"
                        }
                      >
                        {file.status}
                      </Badge>
                      
                      {file.status === "ready" || file.status === "completed" ? (
                        <Link href={`/workspace/${file.id}`}>
                          <Button size="sm" variant="outline">
                            Annotate
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
