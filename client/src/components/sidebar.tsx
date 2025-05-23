import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Eye, 
  Video, 
  Upload, 
  BarChart3, 
  Download, 
  Users, 
  Settings,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  FolderOpen
} from "lucide-react";

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
  duration: number;
  status: string;
  uploadedAt: string;
}

interface CollaborationSession {
  id: number;
  userId: number;
  currentFrame: number;
  isActive: boolean;
  user?: {
    username: string;
    role: string;
  };
}

export default function Sidebar() {
  const [location] = useLocation();

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: videoFiles } = useQuery<VideoFile[]>({
    queryKey: ["/api/video-files"],
  });

  const currentProject = projects?.[0];
  const projectFiles = videoFiles?.filter(file => file.projectId === currentProject?.id) || [];
  
  const completedFiles = projectFiles.filter(file => file.status === "completed").length;
  const inProgressFiles = projectFiles.filter(file => file.status === "processing" || file.status === "ready").length;
  const pendingFiles = projectFiles.filter(file => file.status === "pending").length;
  
  const progressPercentage = projectFiles.length > 0 ? (completedFiles / projectFiles.length) * 100 : 0;

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
      case 'ready':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const navigationItems = [
    { path: "/demo", label: "🎬 Live Demo", icon: Video, active: location === "/demo", special: true },
    { path: "/", label: "Home", icon: Eye, active: location === "/" },
    { path: "/projects", label: "Projects", icon: Settings, active: location === "/projects" },
    { path: "/upload", label: "Upload Data", icon: Upload, active: location === "/upload" },
    { path: "/dashboard", label: "Progress Dashboard", icon: BarChart3, active: location === "/dashboard" },
    { path: "/export", label: "Export Data", icon: Download, active: location === "/export" },
  ];

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <img 
            src="/assets/inksight-logo.png?v=1" 
            alt="InkSight Logo" 
            className="w-10 h-10 rounded-lg"
          />
          <div>
            <h1 className="text-lg font-semibold text-slate-900">InkSight</h1>
            <p className="text-sm text-slate-500">Data Labeling Tool</p>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      <div className="p-4 border-b border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">Current Project</label>
        <Select defaultValue={currentProject?.id.toString()}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a project..." />
          </SelectTrigger>
          <SelectContent>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.name} - {project.courseName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Progress Overview */}
        {currentProject && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Progress</span>
              <span className="font-medium text-slate-900">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 mb-2" />
            <div className="flex justify-between text-xs text-slate-500">
              <span>{completedFiles}/{projectFiles.length} files</span>
              <span>~{Math.max(0, projectFiles.length - completedFiles)}h remaining</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant={item.active ? "default" : "ghost"}
                className={`w-full justify-start space-x-3 ${
                  item.active ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* File Management */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-900">Files & Annotations</h3>
          <Link href="/upload">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search files..." 
            className="pl-10 h-8 text-sm"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-1 mb-4">
          <Badge variant="default" className="text-xs px-2 py-1">All</Badge>
          <Badge variant="outline" className="text-xs px-2 py-1">Pending</Badge>
          <Badge variant="outline" className="text-xs px-2 py-1">In Progress</Badge>
          <Badge variant="outline" className="text-xs px-2 py-1">Complete</Badge>
        </div>

        {/* File List */}
        <div className="space-y-2">
          {projectFiles.length === 0 ? (
            <div className="text-center py-6">
              <Video className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">No files uploaded</p>
              <Link href="/upload">
                <Button variant="outline" size="sm" className="mt-2">
                  Upload Videos
                </Button>
              </Link>
            </div>
          ) : (
            projectFiles.slice(0, 10).map((file) => {
              const isCurrentFile = location.includes(`/workspace/${file.id}`);
              
              return (
                <Card 
                  key={file.id} 
                  className={`p-3 cursor-pointer hover:shadow-sm transition-all ${
                    isCurrentFile ? "border-primary bg-primary/5" : "hover:border-slate-300"
                  }`}
                >
                  <Link href={file.status === "ready" || file.status === "completed" ? `/workspace/${file.id}` : "#"}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                          <Video className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">
                            {file.originalName}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(file.status)}`}>
                              <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{
                                backgroundColor: file.status === 'completed' ? '#10B981' :
                                                file.status === 'ready' ? '#3B82F6' :
                                                file.status === 'processing' ? '#F59E0B' : '#6B7280'
                              }}></span>
                              {file.status}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                            {file.duration && (
                              <>
                                <Clock className="w-3 h-3" />
                                <span>{formatDuration(file.duration)}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{formatDate(file.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {getStatusIcon(file.status)}
                      </Button>
                    </div>
                  </Link>
                </Card>
              );
            })
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-900 mb-3">Project Statistics</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Files</span>
              <span className="font-medium">{projectFiles.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Completed</span>
              <span className="font-medium text-green-600">{completedFiles}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">In Progress</span>
              <span className="font-medium text-amber-600">{inProgressFiles}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Pending</span>
              <span className="font-medium text-slate-600">{pendingFiles}</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">NH</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Nicole Hao</p>
            <p className="text-xs text-slate-500">Lead Annotator</p>
          </div>
          <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
