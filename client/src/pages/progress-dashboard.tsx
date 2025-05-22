import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Video, Clock, Users, Target, TrendingUp, FileText } from "lucide-react";

interface Project {
  id: number;
  name: string;
  courseName: string;
  status: string;
}

interface VideoFile {
  id: number;
  projectId: number;
  originalName: string;
  status: string;
  duration: number;
}

interface Annotation {
  id: number;
  videoFileId: number;
  annotationType: string;
  isValidated: boolean;
  annotatedAt: string;
}

export default function ProgressDashboard() {
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: videoFiles } = useQuery<VideoFile[]>({
    queryKey: ["/api/video-files"],
  });

  const { data: annotations } = useQuery<Annotation[]>({
    queryKey: ["/api/annotations"],
  });

  const currentProject = projects?.[0];
  const projectFiles = videoFiles?.filter(file => file.projectId === currentProject?.id) || [];
  
  const totalFiles = projectFiles.length;
  const completedFiles = projectFiles.filter(file => file.status === "completed").length;
  const inProgressFiles = projectFiles.filter(file => file.status === "processing" || file.status === "ready").length;
  const pendingFiles = projectFiles.filter(file => file.status === "pending").length;
  
  const overallProgress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
  
  const totalAnnotations = annotations?.length || 0;
  const validatedAnnotations = annotations?.filter(ann => ann.isValidated)?.length || 0;
  const validationProgress = totalAnnotations > 0 ? (validatedAnnotations / totalAnnotations) * 100 : 0;

  // Annotation type breakdown
  const annotationsByType = annotations?.reduce((acc, ann) => {
    acc[ann.annotationType] = (acc[ann.annotationType] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number }) || {};

  // Recent activity (last 7 days)
  const recentAnnotations = annotations?.filter(ann => {
    const annotatedDate = new Date(ann.annotatedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return annotatedDate >= weekAgo;
  }) || [];

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const totalDuration = projectFiles.reduce((sum, file) => sum + (file.duration || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Progress Dashboard</h1>
              <p className="text-sm text-slate-500">Track annotation progress and team performance</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Project Overview */}
        {currentProject && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{currentProject.name}</h2>
            <p className="text-slate-600">{currentProject.courseName}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Files</p>
                  <p className="text-2xl font-bold text-slate-900">{totalFiles}</p>
                </div>
                <Video className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Duration</p>
                  <p className="text-2xl font-bold text-slate-900">{formatDuration(totalDuration)}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Annotations</p>
                  <p className="text-2xl font-bold text-slate-900">{totalAnnotations}</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Recent Activity</p>
                  <p className="text-2xl font-bold text-slate-900">{recentAnnotations.length}</p>
                  <p className="text-xs text-slate-500">Last 7 days</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>File Completion Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Overall Progress</span>
                  <span className="font-medium">{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{completedFiles}</div>
                  <div className="text-sm text-slate-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-amber-600">{inProgressFiles}</div>
                  <div className="text-sm text-slate-600">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-500">{pendingFiles}</div>
                  <div className="text-sm text-slate-600">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Annotation Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Validation Progress</span>
                  <span className="font-medium">{Math.round(validationProgress)}%</span>
                </div>
                <Progress value={validationProgress} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{validatedAnnotations}</div>
                  <div className="text-sm text-slate-600">Validated</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-amber-600">{totalAnnotations - validatedAnnotations}</div>
                  <div className="text-sm text-slate-600">Pending Validation</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Annotation Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Annotation Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(annotationsByType).length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No annotations created yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(annotationsByType).map(([type, count]) => {
                  const percentage = totalAnnotations > 0 ? (count / totalAnnotations) * 100 : 0;
                  const typeLabel = type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
                  
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-700">{typeLabel}</span>
                        <span className="font-medium">{count} ({Math.round(percentage)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Status Table */}
        <Card>
          <CardHeader>
            <CardTitle>File Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {projectFiles.length === 0 ? (
              <div className="text-center py-8">
                <Video className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No files uploaded yet</p>
                <Link href="/upload">
                  <Button className="mt-3">Upload Files</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-2 font-medium text-slate-700">File Name</th>
                      <th className="text-left py-3 px-2 font-medium text-slate-700">Duration</th>
                      <th className="text-left py-3 px-2 font-medium text-slate-700">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-slate-700">Annotations</th>
                      <th className="text-left py-3 px-2 font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectFiles.map((file) => {
                      const fileAnnotations = annotations?.filter(ann => ann.videoFileId === file.id) || [];
                      
                      return (
                        <tr key={file.id} className="border-b border-slate-100">
                          <td className="py-3 px-2">
                            <div className="flex items-center space-x-2">
                              <Video className="w-4 h-4 text-slate-400" />
                              <span className="font-medium text-slate-900">{file.originalName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-slate-600">
                            {file.duration ? formatDuration(file.duration) : 'N/A'}
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant={
                              file.status === 'completed' ? 'default' :
                              file.status === 'ready' ? 'secondary' :
                              file.status === 'processing' ? 'outline' : 'destructive'
                            }>
                              {file.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-slate-600">
                            {fileAnnotations.length}
                          </td>
                          <td className="py-3 px-2">
                            {(file.status === 'ready' || file.status === 'completed') && (
                              <Link href={`/workspace/${file.id}`}>
                                <Button size="sm" variant="outline">
                                  Open
                                </Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
