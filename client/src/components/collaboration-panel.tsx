import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarContent, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Users, Eye, MessageSquare, Clock } from "lucide-react";

interface CollaborationSession {
  id: number;
  userId: number;
  currentFrame: number;
  isActive: boolean;
  lastActivity: string;
  user?: {
    username: string;
    role: string;
  };
}

interface CollaborationPanelProps {
  collaborators: CollaborationSession[];
  currentFrame: number;
  onClose: () => void;
}

export default function CollaborationPanel({
  collaborators,
  currentFrame,
  onClose,
}: CollaborationPanelProps) {
  const activeCollaborators = collaborators.filter(c => c.isActive);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const lastActivity = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - lastActivity.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
  };

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'lead_annotator':
        return 'bg-primary text-primary-foreground';
      case 'admin':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getAvatarColor = (userId: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
    ];
    return colors[userId % colors.length];
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">Collaboration</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          {activeCollaborators.length} active annotator{activeCollaborators.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Active Collaborators */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {activeCollaborators.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No active collaborators</p>
                <p className="text-sm text-slate-500">You're working alone on this video</p>
              </div>
            ) : (
              activeCollaborators.map((collaborator) => (
                <Card key={collaborator.id} className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <div className={`w-10 h-10 ${getAvatarColor(collaborator.userId)} rounded-full flex items-center justify-center`}>
                        <span className="text-white text-sm font-medium">
                          {getInitials(collaborator.user?.username || 'U')}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {collaborator.user?.username || `User ${collaborator.userId}`}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getRoleColor(collaborator.user?.role || 'annotator')}`}
                        >
                          {collaborator.user?.role?.replace('_', ' ') || 'annotator'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-xs text-slate-600">
                          <Eye className="w-3 h-3" />
                          <span>Frame {collaborator.currentFrame.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(collaborator.lastActivity)}</span>
                        </div>
                      </div>

                      {/* Frame difference indicator */}
                      {Math.abs(collaborator.currentFrame - currentFrame) > 100 && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {collaborator.currentFrame > currentFrame ? '+' : ''}
                            {collaborator.currentFrame - currentFrame} frames
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Collaboration Tools */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        <h4 className="text-sm font-medium text-slate-900">Collaboration Tools</h4>
        
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <MessageSquare className="w-4 h-4 mr-2" />
            Open Chat
          </Button>
          
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Eye className="w-4 h-4 mr-2" />
            Follow Collaborator
          </Button>
        </div>

        {/* Live Status */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live collaboration enabled</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Changes are synchronized in real-time
          </p>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="p-4 border-t border-slate-200">
        <h4 className="text-sm font-medium text-slate-900 mb-3">Recent Activity</h4>
        <div className="space-y-2">
          <div className="text-xs text-slate-600">
            <span className="font-medium">Nicole H.</span> validated frame 1,247
            <span className="text-slate-500 ml-2">2m ago</span>
          </div>
          <div className="text-xs text-slate-600">
            <span className="font-medium">Arjun M.</span> added 3 annotations
            <span className="text-slate-500 ml-2">5m ago</span>
          </div>
          <div className="text-xs text-slate-600">
            <span className="font-medium">Clément R.</span> marked erasure event
            <span className="text-slate-500 ml-2">12m ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
