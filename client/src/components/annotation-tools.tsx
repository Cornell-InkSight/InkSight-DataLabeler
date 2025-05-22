import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { 
  Square, 
  Boxes, 
  Paintbrush, 
  Eraser, 
  Edit3, 
  Trash2, 
  Undo, 
  Redo, 
  Copy,
  CheckCircle,
  Star
} from "lucide-react";

interface Annotation {
  id: number;
  annotationType: string;
  toolType: string;
  coordinates: any;
  label?: string;
  confidence?: number;
  notes?: string;
  isValidated?: boolean;
}

interface AnnotationToolsProps {
  selectedTool: string;
  selectedAnnotationType: string;
  annotations: Annotation[];
  onToolChange: (tool: string) => void;
  onAnnotationTypeChange: (type: string) => void;
  onUpdateAnnotation: (id: number, updates: any) => void;
  onDeleteAnnotation: (id: number) => void;
  isCreating: boolean;
}

const tools = [
  { id: "bounding-box", name: "Bounding Box", icon: Square, description: "Draw rectangles" },
  { id: "polygon", name: "Boxes", icon: Boxes, description: "Complex shapes" },
  { id: "freehand", name: "Freehand", icon: Paintbrush, description: "Paint regions" },
  { id: "eraser", name: "Eraser", icon: Eraser, description: "Remove marks" },
];

const annotationTypes = [
  { 
    id: "handwritten-text", 
    name: "Handwritten Text", 
    color: "bg-amber-500",
    count: 0
  },
  { 
    id: "mathematical-notation", 
    name: "Mathematical Notation", 
    color: "bg-emerald-500",
    count: 0
  },
  { 
    id: "diagram", 
    name: "Diagram/Figure", 
    color: "bg-blue-500",
    count: 0
  },
  { 
    id: "background", 
    name: "Background", 
    color: "bg-gray-500",
    count: 0
  },
  { 
    id: "erasure-region", 
    name: "Erasure Region", 
    color: "bg-red-500",
    count: 0
  },
];

export default function AnnotationTools({
  selectedTool,
  selectedAnnotationType,
  annotations,
  onToolChange,
  onAnnotationTypeChange,
  onUpdateAnnotation,
  onDeleteAnnotation,
  isCreating,
}: AnnotationToolsProps) {
  const [editingAnnotation, setEditingAnnotation] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const handleEditAnnotation = (annotation: Annotation) => {
    setEditingAnnotation(annotation.id);
    setEditLabel(annotation.label || "");
    setEditNotes(annotation.notes || "");
  };

  const handleSaveEdit = () => {
    if (editingAnnotation) {
      onUpdateAnnotation(editingAnnotation, {
        label: editLabel,
        notes: editNotes,
      });
      setEditingAnnotation(null);
      setEditLabel("");
      setEditNotes("");
    }
  };

  const handleCancelEdit = () => {
    setEditingAnnotation(null);
    setEditLabel("");
    setEditNotes("");
  };

  const handleValidateAnnotation = (id: number) => {
    onUpdateAnnotation(id, { isValidated: true });
  };

  const formatCoordinates = (coordinates: any, toolType: string) => {
    if (toolType === "bounding-box") {
      return `x:${Math.round(coordinates.x)}, y:${Math.round(coordinates.y)}, w:${Math.round(coordinates.width)}, h:${Math.round(coordinates.height)}`;
    } else if (toolType === "polygon") {
      const pointCount = coordinates.points?.length || 0;
      return `${pointCount} points`;
    } else if (toolType === "freehand") {
      const pointCount = coordinates.path?.length || 0;
      return `${pointCount} path points`;
    }
    return "Custom coordinates";
  };

  // Count annotations by type
  const annotationCounts = annotations.reduce((acc, ann) => {
    acc[ann.annotationType] = (acc[ann.annotationType] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
      {/* Tools Header */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Annotation Tools</h3>
      </div>

      {/* Tool Palette */}
      <div className="p-4 border-b border-slate-200">
        <h4 className="text-sm font-medium text-slate-900 mb-3">Drawing Tools</h4>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            const isSelected = selectedTool === tool.id;
            
            return (
              <Button
                key={tool.id}
                variant="outline"
                className={`p-3 h-auto flex flex-col items-center space-y-1 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => onToolChange(tool.id)}
                disabled={isCreating}
              >
                <IconComponent className={`w-5 h-5 ${isSelected ? "text-primary" : "text-slate-600"}`} />
                <span className={`text-xs ${isSelected ? "text-primary font-medium" : "text-slate-700"}`}>
                  {tool.name}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Annotation Categories */}
      <div className="p-4 border-b border-slate-200">
        <h4 className="text-sm font-medium text-slate-900 mb-3">Content Categories</h4>
        <RadioGroup 
          value={selectedAnnotationType} 
          onValueChange={onAnnotationTypeChange}
          className="space-y-2"
        >
          {annotationTypes.map((type) => (
            <div key={type.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50">
              <RadioGroupItem value={type.id} id={type.id} />
              <div className={`w-4 h-4 ${type.color} rounded`}></div>
              <Label htmlFor={type.id} className="flex-1 text-sm cursor-pointer">
                {type.name}
              </Label>
              <Badge variant="secondary" className="text-xs">
                {annotationCounts[type.id] || 0}
              </Badge>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Current Annotations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-900">Frame Annotations</h4>
            <Badge variant="outline" className="text-xs">
              {annotations.length} items
            </Badge>
          </div>

          {annotations.length === 0 ? (
            <div className="text-center py-6">
              <Edit3 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">No annotations yet</p>
              <p className="text-xs text-slate-500">Use the tools above to start annotating</p>
            </div>
          ) : (
            <div className="space-y-2">
              {annotations.map((annotation) => {
                const isEditing = editingAnnotation === annotation.id;
                const typeConfig = annotationTypes.find(t => t.id === annotation.annotationType);
                
                return (
                  <Card key={annotation.id} className="p-3 hover:shadow-sm transition-shadow">
                    <div className="space-y-2">
                      {/* Annotation Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`w-3 h-3 ${typeConfig?.color || 'bg-gray-500'} rounded mt-1`}></div>
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <Input
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                placeholder="Annotation label..."
                                className="text-sm h-8"
                              />
                            ) : (
                              <p className="text-sm font-medium text-slate-900">
                                {annotation.label || typeConfig?.name || "Untitled"}
                              </p>
                            )}
                            <p className="text-xs text-slate-500 font-mono mt-1">
                              {formatCoordinates(annotation.coordinates, annotation.toolType)}
                            </p>
                            {annotation.confidence && (
                              <p className="text-xs text-slate-500">
                                Confidence: {Math.round(annotation.confidence * 100)}%
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {annotation.isValidated && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6"
                            onClick={() => handleEditAnnotation(annotation)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                            onClick={() => onDeleteAnnotation(annotation.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Notes Section */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add notes..."
                            className="text-xs h-16 resize-none"
                          />
                          <div className="flex items-center space-x-2">
                            <Button size="sm" onClick={handleSaveEdit}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        annotation.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                            {annotation.notes}
                          </p>
                        )
                      )}

                      {/* Validation */}
                      {!annotation.isValidated && !isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-7 text-xs"
                          onClick={() => handleValidateAnnotation(annotation.id)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Validate
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Undo className="w-3 h-3 mr-1" />
            Undo
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Redo className="w-3 h-3 mr-1" />
            Redo
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button variant="destructive" size="sm" className="h-8 text-xs">
            <Trash2 className="w-3 h-3 mr-1" />
            Clear All
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Copy className="w-3 h-3 mr-1" />
            Duplicate
          </Button>
        </div>

        {/* Quality Control */}
        <Separator className="my-3" />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">Frame Quality</span>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-3 h-3 text-amber-400 fill-current" />
              ))}
            </div>
          </div>
          <Button className="w-full h-8 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Validate Frame
          </Button>
        </div>
      </div>
    </div>
  );
}
