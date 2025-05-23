// Import routing components from wouter (a lightweight router)
import { Switch, Route } from "wouter";
// Import React Query client and provider for data fetching and caching
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
// Import UI components for notifications and tooltips
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Import page components
import Home from "@/pages/home";
import AnnotationWorkspace from "@/pages/annotation-workspace";
import UploadData from "@/pages/upload-data";
import ProgressDashboard from "@/pages/progress-dashboard";
import ExportData from "@/pages/export-data";
import Projects from "@/pages/projects";
import Demo from "@/pages/demo";
import NotFound from "@/pages/not-found";

// Router component that defines all application routes
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/demo" component={Demo} />
      <Route path="/projects" component={Projects} />
      <Route path="/workspace/:videoId" component={AnnotationWorkspace} />
      <Route path="/upload" component={UploadData} />
      <Route path="/dashboard" component={ProgressDashboard} />
      <Route path="/export" component={ExportData} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Main App component that wraps the application with necessary providers
function App() {
  return (
    // React Query provider for data fetching and caching
    <QueryClientProvider client={queryClient}>
      {/* Tooltip provider for tooltip functionality */}
      <TooltipProvider>
        {/* Toast notifications component */}
        <Toaster />
        {/* Application router */}
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

