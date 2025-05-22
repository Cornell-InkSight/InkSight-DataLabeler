import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, FileText, Video, Database, Package } from "lucide-react";

interface Project {
  id: number;
  name: string;
  courseName: string;
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
}

export default function ExportData() {
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [exportFormat, setExportFormat] = useState<string>("fcn-lecturenet");
  const [includeUnvalidated, setIncludeUnvalidated] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { toast } = useToast();

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
  const projectFiles = videoFiles?.filter(file => 
    file.projectId === currentProject?.id && 
    (file.status === "completed" || file.status === "ready")
  ) || [];

  const handleFileSelection = (fileId: number, checked: boolean) => {
    setSelectedFiles(prev => 
      checked 
        ? [...prev, fileId]
        : prev.filter(id => id !== fileId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedFiles(checked ? projectFiles.map(f => f.id) : []);
  };

  const handleExport = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      if (selectedFiles.length === 1) {
        // Single file export
        const response = await fetch(`/api/export/${selectedFiles[0]}`, {
          method: 'POST',
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `annotations_${selectedFiles[0]}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast({
            title: "Export successful",
            description: "Annotation data has been downloaded.",
          });
        } else {
          throw new Error('Export failed');
        }
      } else {
        // Multiple file export (batch)
        const exports = await Promise.all(
          selectedFiles.map(async (fileId) => {
            const response = await fetch(`/api/export/${fileId}`, {
              method: 'POST',
            });
            if (response.ok) {
              return response.json();
            }
            throw new Error(`Failed to export file ${fileId}`);
          })
        );

        // Combine all exports into a single dataset
        const combinedExport = {
          dataset_metadata: {
            project_name: currentProject?.name,
            course_name: currentProject?.courseName,
            export_format: exportFormat,
            exported_at: new Date().toISOString(),
            total_files: selectedFiles.length,
            include_unvalidated: includeUnvalidated,
          },
          files: exports,
        };

        const blob = new Blob([JSON.stringify(combinedExport, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${currentProject?.name}_dataset.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Batch export successful",
          description: `${selectedFiles.length} files exported as a combined dataset.`,
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred while exporting the data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getFileAnnotationCount = (fileId: number) => {
    return annotations?.filter(ann => 
      ann.videoFileId === fileId && 
      (includeUnvalidated || ann.isValidated)
    ).length || 0;
  };

  const selectedFilesData = projectFiles.filter(f => selectedFiles.includes(f.id));
  const totalSelectedDuration = selectedFilesData.reduce((sum, file) => sum + (file.duration || 0), 0);
  const totalSelectedAnnotations = selectedFiles.reduce((sum, fileId) => sum + getFileAnnotationCount(fileId), 0);

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
              <h1 className="text-xl font-semibold text-slate-900">Export Data</h1>
              <p className="text-sm text-slate-500">Download training datasets for FCN-Lecture Net</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Export Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Export Format</label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fcn-lecturenet">FCN-Lecture Net Format</SelectItem>
                  <SelectItem value="coco">COCO JSON Format</SelectItem>
                  <SelectItem value="yolo">YOLO Format</SelectItem>
                  <SelectItem value="pascal-voc">Pascal VOC XML</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                FCN-Lecture Net format is optimized for the InkSight training pipeline
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Export Options</label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-unvalidated"
                  checked={includeUnvalidated}
                  onCheckedChange={setIncludeUnvalidated}
                />
                <label htmlFor="include-unvalidated" className="text-sm text-slate-700">
                  Include unvalidated annotations
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Select Files to Export</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedFiles.length === projectFiles.length && projectFiles.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-slate-600">Select All</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectFiles.length === 0 ? (
              <div className="text-center py-8">
                <Video className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No completed files available for export</p>
                <p className="text-sm text-slate-500">Complete annotation work to export training data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projectFiles.map((file) => {
                  const annotationCount = getFileAnnotationCount(file.id);
                  const isSelected = selectedFiles.includes(file.id);
                  
                  return (
                    <div
                      key={file.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleFileSelection(file.id, checked as boolean)}
                          />
                          <div className="flex items-center space-x-2">
                            <Video className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-900">{file.originalName}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-slate-600">
                              {formatDuration(file.duration || 0)} • {annotationCount} annotations
                            </p>
                            <Badge variant={file.status === "completed" ? "default" : "secondary"}>
                              {file.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Summary */}
        {selectedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Export Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{selectedFiles.length}</div>
                  <div className="text-sm text-slate-600">Selected Files</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{formatDuration(totalSelectedDuration)}</div>
                  <div className="text-sm text-slate-600">Total Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{totalSelectedAnnotations}</div>
                  <div className="text-sm text-slate-600">Total Annotations</div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200">
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full"
                  size="lg"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Preparing Export...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Information */}
        <Card>
          <CardHeader>
            <CardTitle>Export Format Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-medium text-slate-900">FCN-Lecture Net Format</h4>
              <p className="text-sm text-slate-600 mt-1">
                Optimized for the InkSight training pipeline. Includes temporal event detection, 
                handwritten text segmentation, and mathematical notation classification data.
              </p>
            </div>
            
            <div className="text-sm text-slate-600 space-y-2">
              <p><strong>Includes:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Frame-by-frame annotation data with bounding boxes and polygons</li>
                <li>Temporal event markers (erasure detection, content changes)</li>
                <li>Annotation type classifications (handwritten text, mathematical notation, diagrams)</li>
                <li>Validation status and confidence scores</li>
                <li>Video metadata (resolution, frame count, duration)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
