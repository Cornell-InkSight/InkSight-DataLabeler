import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Play, Tag, Download, ArrowRight, CheckCircle } from "lucide-react";

export default function Demo() {
  const [currentStep, setCurrentStep] = useState(1);
  const [demoProgress, setDemoProgress] = useState(0);

  const steps = [
    { id: 1, title: "Upload Video", description: "Upload a lecture video for annotation" },
    { id: 2, title: "Annotate Content", description: "Label handwriting, math notation, and diagrams" },
    { id: 3, title: "Quality Control", description: "Validate annotations for training quality" },
    { id: 4, title: "Export Training Data", description: "Generate FCN-Lecture Net compatible dataset" },
    { id: 5, title: "InkSight Integration", description: "Integrate with InkSight MVP for AI improvement" }
  ];

  const simulateDemo = () => {
    const interval = setInterval(() => {
      setDemoProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <img 
            src="/assets/inksight-logo.png?v=1" 
            alt="InkSight Logo" 
            className="w-12 h-12 rounded-lg"
          />
          <h1 className="text-3xl font-bold text-gray-900">
            InkSight Data Labeling Tool - Complete Demo
          </h1>
        </div>
        <p className="text-lg text-gray-600 mb-6">
          This demo shows the complete workflow from video upload to AI model training data export and InkSight MVP integration.
        </p>
        
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : step.id}
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="mb-4" />
        </div>
      </div>

      <Tabs value={`step-${currentStep}`} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {steps.map((step) => (
            <TabsTrigger 
              key={step.id} 
              value={`step-${step.id}`}
              disabled={step.id > currentStep}
              onClick={() => setCurrentStep(step.id)}
            >
              Step {step.id}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Step 1: Upload Video */}
        <TabsContent value="step-1" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Step 1: Upload Lecture Video
              </CardTitle>
              <CardDescription>
                Upload a STEM lecture video to begin the annotation process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Demo Video: Calculus Lecture</p>
                <p className="text-gray-600 mb-4">Sample lecture covering derivatives and integrals</p>
                <div className="space-y-2">
                  <Badge variant="outline">Duration: 45 minutes</Badge>
                  <Badge variant="outline">Resolution: 1920x1080</Badge>
                  <Badge variant="outline">Content: Mathematical notation, handwriting</Badge>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What happens during upload:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Video is processed and frames are extracted</li>
                  <li>• Metadata (duration, resolution, frame count) is captured</li>
                  <li>• Video status changes from "pending" → "processing" → "ready"</li>
                  <li>• System prepares for frame-by-frame annotation</li>
                </ul>
              </div>

              <Button onClick={() => setCurrentStep(2)} className="w-full">
                Simulate Video Upload <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Annotate Content */}
        <TabsContent value="step-2" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Step 2: Annotate Video Content
              </CardTitle>
              <CardDescription>
                Label handwritten text, mathematical notation, and diagrams frame-by-frame
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Annotation Types */}
                <div className="space-y-4">
                  <h4 className="font-medium">Annotation Categories:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-4 h-4 bg-amber-500 rounded"></div>
                      <div>
                        <p className="font-medium">Handwritten Text</p>
                        <p className="text-sm text-gray-600">Student notes, instructor writing</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                      <div>
                        <p className="font-medium">Mathematical Notation</p>
                        <p className="text-sm text-gray-600">Equations, symbols, formulas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <div>
                        <p className="font-medium">Diagrams</p>
                        <p className="text-sm text-gray-600">Graphs, charts, illustrations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-4 h-4 bg-gray-500 rounded"></div>
                      <div>
                        <p className="font-medium">Background</p>
                        <p className="text-sm text-gray-600">Whiteboard, slide content</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demo Annotation Results */}
                <div className="space-y-4">
                  <h4 className="font-medium">Sample Annotations Created:</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="font-medium text-amber-800">Frame 1,247: Derivative Equation</p>
                      <p className="text-sm text-amber-700">Bounding box around "d/dx(x²) = 2x"</p>
                      <Badge variant="outline" className="mt-1">Confidence: 0.95</Badge>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="font-medium text-emerald-800">Frame 1,890: Integral Symbol</p>
                      <p className="text-sm text-emerald-700">Polygon around ∫ symbol</p>
                      <Badge variant="outline" className="mt-1">Confidence: 0.88</Badge>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-800">Frame 2,156: Function Graph</p>
                      <p className="text-sm text-blue-700">Freehand annotation of parabola</p>
                      <Badge variant="outline" className="mt-1">Confidence: 0.92</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Real-time Collaboration Features:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Multiple annotators work simultaneously on different frames</li>
                  <li>• Live cursor tracking and annotation updates via WebSocket</li>
                  <li>• Frame synchronization for team coordination</li>
                  <li>• Automatic conflict resolution and annotation merging</li>
                </ul>
              </div>

              <Button onClick={() => setCurrentStep(3)} className="w-full">
                Continue to Quality Control <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Quality Control */}
        <TabsContent value="step-3" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Step 3: Quality Control & Validation
              </CardTitle>
              <CardDescription>
                Lead annotators review and validate annotations before training data export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Validation Process */}
                <div className="space-y-4">
                  <h4 className="font-medium">Validation Workflow:</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Review Queue</p>
                        <p className="text-sm text-gray-600">Lead annotator reviews all annotations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Validate/Reject</p>
                        <p className="text-sm text-gray-600">Mark as approved or request changes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Quality Metrics</p>
                        <p className="text-sm text-gray-600">Track inter-annotator agreement</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quality Metrics */}
                <div className="space-y-4">
                  <h4 className="font-medium">Demo Project Quality Metrics:</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Validation Coverage</span>
                        <span className="text-green-600">96.5%</span>
                      </div>
                      <Progress value={96.5} className="h-2" />
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Inter-Annotator Agreement</span>
                        <span className="text-green-600">89.2%</span>
                      </div>
                      <Progress value={89.2} className="h-2" />
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Confidence Score Average</span>
                        <span className="text-green-600">91.7%</span>
                      </div>
                      <Progress value={91.7} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Quality Control Benefits:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Ensures high-quality training data for FCN-Lecture Net</li>
                  <li>• Catches annotation errors before they affect model training</li>
                  <li>• Provides feedback loop for annotator improvement</li>
                  <li>• Maintains consistent annotation standards across team</li>
                </ul>
              </div>

              <Button onClick={() => setCurrentStep(4)} className="w-full">
                Proceed to Data Export <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 4: Export Training Data */}
        <TabsContent value="step-4" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Step 4: Export Training Data
              </CardTitle>
              <CardDescription>
                Generate FCN-Lecture Net compatible dataset for model training
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Export Formats */}
                <div className="space-y-4">
                  <h4 className="font-medium">Available Export Formats:</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg bg-blue-50">
                      <p className="font-medium">FCN-Lecture Net JSON</p>
                      <p className="text-sm text-gray-600">Optimized format for model training</p>
                      <Badge variant="outline" className="mt-1">Recommended</Badge>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">COCO Format</p>
                      <p className="text-sm text-gray-600">Computer vision standard</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">CSV Export</p>
                      <p className="text-sm text-gray-600">Tabular data for analysis</p>
                    </div>
                  </div>
                </div>

                {/* Export Statistics */}
                <div className="space-y-4">
                  <h4 className="font-medium">Export Statistics:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">1,247</p>
                      <p className="text-sm text-gray-600">Total Annotations</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">1,205</p>
                      <p className="text-sm text-gray-600">Validated</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600">2,700</p>
                      <p className="text-sm text-gray-600">Total Frames</p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <p className="text-2xl font-bold text-orange-600">45</p>
                      <p className="text-sm text-gray-600">Minutes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Export Data */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Sample Export Data (FCN Format):</h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  "video_metadata": {
    "video_id": 123,
    "duration": 2700.5,
    "total_frames": 67500,
    "resolution": "1920x1080",
    "course": "Calculus I"
  },
  "annotations": [
    {
      "frame_number": 1247,
      "timestamp": 49.88,
      "regions": [
        {
          "type": "mathematical_notation",
          "coordinates": {
            "x": 245, "y": 120,
            "width": 180, "height": 45
          },
          "label": "derivative_equation",
          "confidence": 0.95,
          "validated": true
        }
      ]
    }
  ]
}`}
                </pre>
              </div>

              <Button onClick={() => setCurrentStep(5)} className="w-full">
                Export Complete - View Integration <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 5: InkSight Integration */}
        <TabsContent value="step-5" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Step 5: InkSight MVP Integration
              </CardTitle>
              <CardDescription>
                How the labeled data improves the InkSight AI note-taking system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Integration Process */}
                <div className="space-y-4">
                  <h4 className="font-medium">Integration Workflow:</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-blue-50">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                        <span className="text-sm font-medium">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Training Data Export</p>
                        <p className="text-sm text-gray-600">Labeled data sent to training pipeline</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                        <span className="text-sm font-medium">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Model Training</p>
                        <p className="text-sm text-gray-600">FCN-Lecture Net learns from annotations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-purple-50">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white">
                        <span className="text-sm font-medium">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Model Deployment</p>
                        <p className="text-sm text-gray-600">Updated model deployed to InkSight MVP</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-orange-50">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white">
                        <span className="text-sm font-medium">4</span>
                      </div>
                      <div>
                        <p className="font-medium">Improved Recognition</p>
                        <p className="text-sm text-gray-600">Better handwriting and math detection</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Improvements */}
                <div className="space-y-4">
                  <h4 className="font-medium">Expected Performance Improvements:</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Handwriting Recognition</span>
                        <span className="text-green-600">+15%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                      <p className="text-xs text-gray-600 mt-1">85% → 100% accuracy</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Math Notation Detection</span>
                        <span className="text-green-600">+22%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                      <p className="text-xs text-gray-600 mt-1">78% → 100% accuracy</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Diagram Understanding</span>
                        <span className="text-green-600">+18%</span>
                      </div>
                      <Progress value={82} className="h-2" />
                      <p className="text-xs text-gray-600 mt-1">82% → 100% accuracy</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                <h4 className="font-medium mb-4 text-center">Complete Integration Success! 🎉</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">1,247</p>
                    <p className="text-sm text-gray-600">Annotations Created</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">96.5%</p>
                    <p className="text-sm text-gray-600">Validation Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">+18%</p>
                    <p className="text-sm text-gray-600">Model Improvement</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium mb-2">Continuous Learning Loop:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• New annotations continuously improve model performance</li>
                  <li>• Active learning suggests which frames need annotation priority</li>
                  <li>• Model feedback identifies areas needing more training data</li>
                  <li>• Automated quality metrics ensure consistent data standards</li>
                </ul>
              </div>

              <Button onClick={() => {setCurrentStep(1); setDemoProgress(0);}} className="w-full">
                Restart Demo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}