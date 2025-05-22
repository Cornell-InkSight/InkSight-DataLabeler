import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, ArrowLeft, Video, FileVideo, Check, Clock, AlertCircle } from "lucide-react";

interface Project {
  id: number;
  name: string;
  courseName: string;
}

interface VideoFile {
  id: number;
  projectId: number;
  originalName: string;
  fileSize: number;
  status: string;
  uploadedAt: string;
}

export default function UploadData() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: videoFiles } = useQuery<VideoFile[]>({
    queryKey: ["/api/video-files"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('projectId', selectedProjectId);
      formData.append('uploadedBy', '1'); // TODO: Get from auth context

      const response = await fetch('/api/video-files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-files"] });
      toast({
        title: "Upload successful",
        description: "Video file has been uploaded and is being processed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length !== files.length) {
      toast({
        title: "Invalid files detected",
        description: "Only video files are allowed.",
        variant: "destructive",
      });
    }
    
    setSelectedFiles(videoFiles);
  };

  const handleUpload = async () => {
    if (!selectedProjectId || selectedFiles.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select a project and at least one video file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[file.name] || 0;
            if (current < 90) {
              return { ...prev, [file.name]: current + 10 };
            }
            clearInterval(progressInterval);
            return prev;
          });
        }, 200);

        await uploadMutation.mutateAsync(file);
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        clearInterval(progressInterval);
      }
      
      setSelectedFiles([]);
      setUploadProgress({});
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'processing':
      case 'ready':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const recentUploads = videoFiles?.slice(0, 10) || [];

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
              <h1 className="text-xl font-semibold text-slate-900">Upload Data</h1>
              <p className="text-sm text-slate-500">Add new lecture videos for annotation</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload Video Files</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="project">Select Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name} - {project.courseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Selection */}
            <div className="space-y-2">
              <Label htmlFor="files">Video Files</Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
                <Input
                  type="file"
                  id="files"
                  multiple
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Label
                  htmlFor="files"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  <FileVideo className="w-12 h-12 text-slate-400" />
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      Click to upload video files
                    </span>
                    <p className="text-sm text-slate-500 mt-1">
                      Support for MP4, AVI, MOV, and other video formats (max 5GB per file)
                    </p>
                  </div>
                </Label>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-900">Selected Files</h3>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Video className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      
                      {uploadProgress[file.name] !== undefined && (
                        <div className="w-32">
                          <Progress value={uploadProgress[file.name]} className="h-2" />
                          <p className="text-xs text-slate-500 mt-1 text-center">
                            {uploadProgress[file.name]}%
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedProjectId || selectedFiles.length === 0 || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUploads.length === 0 ? (
              <div className="text-center py-8">
                <Video className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No uploads yet</p>
                <p className="text-sm text-slate-500">Your uploaded videos will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUploads.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                        <Video className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{file.originalName}</p>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <span>{formatFileSize(file.fileSize)}</span>
                          <span>•</span>
                          <span>Uploaded {formatDate(file.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(file.status)}
                        <Badge variant={
                          file.status === 'completed' ? 'default' :
                          file.status === 'ready' ? 'secondary' :
                          file.status === 'processing' ? 'outline' : 'destructive'
                        }>
                          {file.status}
                        </Badge>
                      </div>
                      
                      {(file.status === 'ready' || file.status === 'completed') && (
                        <Link href={`/workspace/${file.id}`}>
                          <Button size="sm" variant="outline">
                            Annotate
                          </Button>
                        </Link>
                      )}
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
