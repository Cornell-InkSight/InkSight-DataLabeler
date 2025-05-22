import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Annotation {
  id: number;
  videoFileId: number;
  frameNumber: number;
  annotationType: string;
  toolType: string;
  coordinates: any;
  label?: string;
  confidence?: number;
  notes?: string;
  annotatedBy: number;
  annotatedAt: string;
  isValidated?: boolean;
  validatedBy?: number;
  validatedAt?: string;
}

interface CreateAnnotationData {
  videoFileId: number;
  frameNumber: number;
  annotationType: string;
  toolType: string;
  coordinates: any;
  label?: string;
  notes?: string;
  annotatedBy: number;
}

export function useAnnotations(videoFileId?: number) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch annotations for the video file
  const { data: annotations = [], isLoading } = useQuery<Annotation[]>({
    queryKey: ["/api/annotations", { videoFileId }],
    enabled: !!videoFileId,
  });

  // Create annotation mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateAnnotationData) => {
      const response = await apiRequest('POST', '/api/annotations', data);
      return response.json();
    },
    onSuccess: (newAnnotation) => {
      queryClient.setQueryData<Annotation[]>(["/api/annotations", { videoFileId }], (old = []) => {
        return [...old, newAnnotation];
      });
      toast({
        title: "Annotation created",
        description: "New annotation has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create annotation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update annotation mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Annotation> }) => {
      const response = await apiRequest('PATCH', `/api/annotations/${id}`, updates);
      return response.json();
    },
    onSuccess: (updatedAnnotation) => {
      queryClient.setQueryData<Annotation[]>(["/api/annotations", { videoFileId }], (old = []) => {
        return old.map(ann => ann.id === updatedAnnotation.id ? updatedAnnotation : ann);
      });
      toast({
        title: "Annotation updated",
        description: "Changes have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update annotation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete annotation mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/annotations/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Annotation[]>(["/api/annotations", { videoFileId }], (old = []) => {
        return old.filter(ann => ann.id !== deletedId);
      });
      setSelectedAnnotation(null);
      toast({
        title: "Annotation deleted",
        description: "Annotation has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete annotation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Validate annotation mutation
  const validateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/annotations/${id}`, {
        isValidated: true,
        validatedBy: 1, // TODO: Get from auth context
        validatedAt: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: (validatedAnnotation) => {
      queryClient.setQueryData<Annotation[]>(["/api/annotations", { videoFileId }], (old = []) => {
        return old.map(ann => ann.id === validatedAnnotation.id ? validatedAnnotation : ann);
      });
      toast({
        title: "Annotation validated",
        description: "Annotation has been marked as validated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to validate annotation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const createAnnotation = useCallback((data: CreateAnnotationData) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const updateAnnotation = useCallback((id: number, updates: Partial<Annotation>) => {
    updateMutation.mutate({ id, updates });
  }, [updateMutation]);

  const deleteAnnotation = useCallback((id: number) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const validateAnnotation = useCallback((id: number) => {
    validateMutation.mutate(id);
  }, [validateMutation]);

  const getAnnotationsForFrame = useCallback((frameNumber: number) => {
    return annotations.filter(ann => ann.frameNumber === frameNumber);
  }, [annotations]);

  const getAnnotationsByType = useCallback((annotationType: string) => {
    return annotations.filter(ann => ann.annotationType === annotationType);
  }, [annotations]);

  const getValidatedAnnotations = useCallback(() => {
    return annotations.filter(ann => ann.isValidated);
  }, [annotations]);

  const getUnvalidatedAnnotations = useCallback(() => {
    return annotations.filter(ann => !ann.isValidated);
  }, [annotations]);

  const getAnnotationStats = useCallback(() => {
    const total = annotations.length;
    const validated = annotations.filter(ann => ann.isValidated).length;
    const byType = annotations.reduce((acc, ann) => {
      acc[ann.annotationType] = (acc[ann.annotationType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      total,
      validated,
      unvalidated: total - validated,
      validationProgress: total > 0 ? (validated / total) * 100 : 0,
      byType,
    };
  }, [annotations]);

  return {
    // Data
    annotations,
    selectedAnnotation,
    isLoading,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isValidating: validateMutation.isPending,

    // Actions
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    validateAnnotation,
    setSelectedAnnotation,

    // Helpers
    getAnnotationsForFrame,
    getAnnotationsByType,
    getValidatedAnnotations,
    getUnvalidatedAnnotations,
    getAnnotationStats,
  };
}
