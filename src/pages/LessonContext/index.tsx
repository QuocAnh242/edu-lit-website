import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Search,
  ArrowLeft,
  Layers,
  FileText
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAllLessonContexts,
  createLessonContext,
  updateLessonContext,
  deleteLessonContext,
  getLessonContextById,
  LessonContextDto,
  CreateLessonContextRequest,
  UpdateLessonContextRequest
} from '@/services/lession-context.api';
import { getSessionById, SessionDto } from '@/services/session.api';

export default function LessonContextPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();

  // State
  const [lessonContextDialogOpen, setLessonContextDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingLessonContext, setEditingLessonContext] =
    useState<LessonContextDto | null>(null);
  const [viewingLessonContext, setViewingLessonContext] =
    useState<LessonContextDto | null>(null);
  const [lessonContextToDelete, setLessonContextToDelete] =
    useState<LessonContextDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lessonContextForm, setLessonContextForm] =
    useState<CreateLessonContextRequest>({
      sessionId: sessionId || '',
      parentLessonId: null,
      lessonTitle: '',
      lessonContent: '',
      position: 1,
      level: null
    });
  const [formErrors, setFormErrors] = useState<{
    lessonTitle?: string;
    position?: string;
    level?: string;
  }>({});

  // Fetch session details
  const { data: sessionData, isLoading: loadingSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      return await getSessionById(sessionId);
    },
    enabled: !!sessionId
  });

  const session = sessionData?.data as SessionDto | undefined;

  // Fetch lesson contexts for this session
  const {
    data: lessonContextsData,
    isLoading: loadingLessonContexts,
    isError: lessonContextsError
  } = useQuery({
    queryKey: ['lessonContexts', sessionId, searchTerm],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      return await getAllLessonContexts({
        pageNumber: 1,
        pageSize: 100,
        sessionId: sessionId,
        searchTerm: searchTerm || undefined
      });
    },
    enabled: !!sessionId
  });

  const lessonContexts = useMemo(() => {
    return (lessonContextsData?.data?.items || []) as LessonContextDto[];
  }, [lessonContextsData?.data?.items]);

  // Mutations
  const createLessonContextMutation = useMutation({
    mutationFn: async (data: CreateLessonContextRequest) => {
      return await createLessonContext(data);
    },
    onSuccess: () => {
      toast.success('Lesson context created successfully');
      queryClient.invalidateQueries({ queryKey: ['lessonContexts'] });
      setLessonContextDialogOpen(false);
      resetLessonContextForm();
    },
    onError: (error: unknown) => {
      const apiError = error as {
        message?: string;
        errors?: string[];
        errorCode?: string | number;
      };

      let errorMessage = apiError?.message || 'Failed to create lesson context';

      if (apiError?.errors && apiError.errors.length > 0) {
        errorMessage = apiError.errors.join(', ');
      }

      toast.error(errorMessage, {
        duration: 5000
      });
      console.error('Create Lesson Context Error:', error);
    }
  });

  const updateLessonContextMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: UpdateLessonContextRequest;
    }) => {
      return await updateLessonContext(id, data);
    },
    onSuccess: () => {
      toast.success('Lesson context updated successfully');
      queryClient.invalidateQueries({ queryKey: ['lessonContexts'] });
      setLessonContextDialogOpen(false);
      setEditingLessonContext(null);
      resetLessonContextForm();
    },
    onError: (error: unknown) => {
      const apiError = error as {
        message?: string;
        errors?: string[];
        errorCode?: string | number;
      };

      let errorMessage = apiError?.message || 'Failed to update lesson context';

      if (apiError?.errors && apiError.errors.length > 0) {
        errorMessage = apiError.errors.join(', ');
      }

      toast.error(errorMessage, {
        duration: 5000
      });
      console.error('Update Lesson Context Error:', error);
    }
  });

  const deleteLessonContextMutation = useMutation({
    mutationFn: async (lessonContextId: string) => {
      return await deleteLessonContext(lessonContextId);
    },
    onSuccess: () => {
      toast.success('Lesson context deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['lessonContexts'] });
      setDeleteDialogOpen(false);
      setLessonContextToDelete(null);
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to delete lesson context';
      toast.error(errorMessage);
    }
  });

  // Handlers
  const handleCreateLessonContext = () => {
    setEditingLessonContext(null);
    resetLessonContextForm();
    setLessonContextDialogOpen(true);
  };

  const handleEditLessonContext = (lessonContext: LessonContextDto) => {
    setEditingLessonContext(lessonContext);
    setLessonContextForm({
      sessionId: lessonContext.sessionId,
      parentLessonId: lessonContext.parentLessonId || null,
      lessonTitle: lessonContext.lessonTitle,
      lessonContent: lessonContext.lessonContent || '',
      position: lessonContext.position,
      level: lessonContext.level || null
    });
    setLessonContextDialogOpen(true);
  };

  const handleDeleteLessonContext = (lessonContext: LessonContextDto) => {
    setLessonContextToDelete(lessonContext);
    setDeleteDialogOpen(true);
  };

  const handleViewLessonContext = async (lessonContext: LessonContextDto) => {
    try {
      const response = await getLessonContextById(lessonContext.id);
      if (response.success && response.data) {
        setViewingLessonContext(response.data);
        setViewDialogOpen(true);
      } else {
        toast.error('Failed to load lesson context details');
      }
    } catch (error) {
      console.error('Error fetching lesson context details:', error);
      toast.error('Failed to load lesson context details');
    }
  };

  const validateLessonContextForm = (): {
    isValid: boolean;
    errors: { lessonTitle?: string; position?: string; level?: string };
  } => {
    const errors: {
      lessonTitle?: string;
      position?: string;
      level?: string;
    } = {};

    // Validate Lesson Title
    if (!lessonContextForm.lessonTitle.trim()) {
      errors.lessonTitle = 'Lesson title is required';
    } else if (lessonContextForm.lessonTitle.trim().length > 200) {
      errors.lessonTitle = 'Lesson title cannot exceed 200 characters';
    }

    // Validate Position
    if (lessonContextForm.position < 0) {
      errors.position = 'Position must be greater than or equal to 0';
    }

    // Validate Level
    if (
      lessonContextForm.level !== null &&
      lessonContextForm.level !== undefined &&
      lessonContextForm.level < 0
    ) {
      errors.level = 'Level must be greater than or equal to 0 if provided';
    }

    setFormErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleSaveLessonContext = () => {
    setFormErrors({});

    const validation = validateLessonContextForm();
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    const dataToSend: CreateLessonContextRequest | UpdateLessonContextRequest =
      {
        lessonTitle: lessonContextForm.lessonTitle.trim(),
        lessonContent: lessonContextForm.lessonContent?.trim() || null,
        position: lessonContextForm.position,
        level: lessonContextForm.level
      };

    if (editingLessonContext) {
      updateLessonContextMutation.mutate({
        id: editingLessonContext.id,
        data: dataToSend
      });
    } else {
      createLessonContextMutation.mutate({
        ...dataToSend,
        sessionId: sessionId || '',
        parentLessonId: lessonContextForm.parentLessonId
      } as CreateLessonContextRequest);
    }
  };

  const handleDeleteConfirm = () => {
    if (lessonContextToDelete) {
      deleteLessonContextMutation.mutate(lessonContextToDelete.id);
    }
  };

  const resetLessonContextForm = () => {
    setLessonContextForm({
      sessionId: sessionId || '',
      parentLessonId: null,
      lessonTitle: '',
      lessonContent: '',
      position: lessonContexts.length + 1,
      level: null
    });
    setFormErrors({});
  };

  // Update position when lesson contexts change
  React.useEffect(() => {
    if (!editingLessonContext && lessonContexts.length > 0) {
      setLessonContextForm((prev) => ({
        ...prev,
        position: Math.max(...lessonContexts.map((lc) => lc.position), 0) + 1
      }));
    }
  }, [lessonContexts, editingLessonContext]);

  // Get parent session courseId for navigation
  const getBackPath = () => {
    if (session?.courseId) {
      return `/course/${session.courseId}/sessions`;
    }
    return '/course';
  };

  return (
    <>
      <style>{`
        html {
          overflow-y: scroll;
          scrollbar-gutter: stable;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
      `}</style>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="animate-fade-in-up mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(getBackPath())}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sessions
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 flex items-center gap-2 text-4xl font-bold text-purple-600">
                  <FileText className="h-10 w-10 transition-transform hover:scale-110" />
                  Lesson Contexts
                </h1>
                {loadingSession ? (
                  <Skeleton className="h-6 w-64" />
                ) : session ? (
                  <p className="text-lg text-gray-600">
                    Manage lesson contexts for:{' '}
                    <span className="font-semibold">{session.title}</span>
                  </p>
                ) : (
                  <p className="text-lg text-gray-600">
                    Manage lesson contexts
                  </p>
                )}
              </div>
              <Button
                onClick={handleCreateLessonContext}
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg transition-all duration-300 hover:scale-105 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Create Lesson Context
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <Card
            className="animate-slide-in mb-6 shadow-lg"
            style={{ animationDelay: '0.1s', opacity: 0 }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search lesson contexts by title or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lesson Contexts Table */}
          <Card
            className="animate-slide-in shadow-lg transition-all duration-300 hover:shadow-2xl"
            style={{ animationDelay: '0.2s', opacity: 0 }}
          >
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 transition-transform hover:scale-110" />
                  All Lesson Contexts
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {lessonContexts.length}{' '}
                  {lessonContexts.length === 1 ? 'Lesson' : 'Lessons'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingLessonContexts ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              ) : lessonContextsError ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <FileText className="mb-4 h-16 w-16 text-red-300" />
                  <h3 className="mb-2 text-xl font-semibold text-red-700">
                    Error loading lesson contexts
                  </h3>
                  <p className="mb-4 text-gray-500">
                    An error occurred while loading lesson contexts. Please try
                    again.
                  </p>
                  <Button
                    onClick={() =>
                      queryClient.invalidateQueries({
                        queryKey: ['lessonContexts']
                      })
                    }
                    variant="outline"
                    className="gap-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : lessonContexts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <FileText className="mb-4 h-16 w-16 text-gray-300" />
                  <h3 className="mb-2 text-xl font-semibold text-gray-700">
                    No lesson contexts yet
                  </h3>
                  <p className="mb-4 text-gray-500">
                    {searchTerm
                      ? 'No lesson contexts found matching your search.'
                      : 'Get started by creating your first lesson context'}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={handleCreateLessonContext}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create First Lesson Context
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[8%]">Position</TableHead>
                      <TableHead className="w-[8%]">Level</TableHead>
                      <TableHead className="w-[25%]">Title</TableHead>
                      <TableHead className="w-[40%]">Content</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessonContexts
                      .sort((a, b) => {
                        // Sort by position first, then by level
                        if (a.position !== b.position) {
                          return a.position - b.position;
                        }
                        return (a.level || 0) - (b.level || 0);
                      })
                      .map((lessonContext: LessonContextDto) => (
                        <TableRow
                          key={lessonContext.id}
                          className="transition-colors duration-200 hover:bg-purple-50"
                        >
                          <TableCell className="font-medium">
                            <Badge variant="outline" className="font-mono">
                              #{lessonContext.position}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {lessonContext.level !== null &&
                            lessonContext.level !== undefined ? (
                              <Badge variant="secondary" className="gap-1">
                                <Layers className="h-3 w-3" />
                                Level {lessonContext.level}
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="text-sm font-semibold">
                              {lessonContext.lessonTitle}
                            </div>
                            {lessonContext.parentLessonId && (
                              <div className="mt-1 text-xs text-gray-500">
                                Parent:{' '}
                                {lessonContext.parentLessonId.substring(0, 8)}
                                ...
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="line-clamp-2 max-w-md text-sm text-gray-600">
                              {lessonContext.lessonContent || 'No content'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {lessonContext.createdAt
                              ? new Date(
                                  lessonContext.createdAt
                                ).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleViewLessonContext(lessonContext)
                                }
                                className="transition-all duration-200 hover:scale-110 hover:bg-blue-50"
                                title="View lesson context"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleEditLessonContext(lessonContext)
                                }
                                className="transition-all duration-200 hover:scale-110 hover:bg-green-50"
                                title="Edit lesson context"
                              >
                                <Edit className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleDeleteLessonContext(lessonContext)
                                }
                                disabled={deleteLessonContextMutation.isPending}
                                className="transition-all duration-200 hover:scale-110 hover:bg-red-50"
                                title="Delete lesson context"
                              >
                                {deleteLessonContextMutation.isPending &&
                                lessonContextToDelete?.id ===
                                  lessonContext.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Lesson Context Create/Edit Dialog */}
        <Dialog
          open={lessonContextDialogOpen}
          onOpenChange={setLessonContextDialogOpen}
        >
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLessonContext
                  ? 'Edit Lesson Context'
                  : 'Create Lesson Context'}
              </DialogTitle>
              <DialogDescription>
                {editingLessonContext
                  ? 'Update the lesson context information.'
                  : 'Create a new lesson context for this session.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="lessonTitle">Lesson Title *</Label>
                <Input
                  id="lessonTitle"
                  placeholder="Enter lesson title (max 200 characters)"
                  value={lessonContextForm.lessonTitle}
                  onChange={(e) => {
                    setLessonContextForm({
                      ...lessonContextForm,
                      lessonTitle: e.target.value
                    });
                    if (formErrors.lessonTitle) {
                      setFormErrors({ ...formErrors, lessonTitle: undefined });
                    }
                  }}
                  className={formErrors.lessonTitle ? 'border-red-500' : ''}
                  maxLength={200}
                />
                {formErrors.lessonTitle && (
                  <p className="flex items-center gap-1 text-sm text-red-600">
                    <span>⚠</span> {formErrors.lessonTitle}
                  </p>
                )}
                {!formErrors.lessonTitle && lessonContextForm.lessonTitle && (
                  <p className="text-xs text-gray-500">
                    {lessonContextForm.lessonTitle.length}/200 characters
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lessonContent">Lesson Content</Label>
                <Textarea
                  id="lessonContent"
                  placeholder="Enter lesson content (optional)"
                  value={lessonContextForm.lessonContent || ''}
                  onChange={(e) =>
                    setLessonContextForm({
                      ...lessonContextForm,
                      lessonContent: e.target.value
                    })
                  }
                  rows={8}
                  className="resize-none"
                />
                {lessonContextForm.lessonContent && (
                  <p className="text-xs text-gray-500">
                    {lessonContextForm.lessonContent.length} characters
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    type="number"
                    min="0"
                    placeholder="1"
                    value={lessonContextForm.position}
                    onChange={(e) => {
                      setLessonContextForm({
                        ...lessonContextForm,
                        position: parseInt(e.target.value) || 0
                      });
                      if (formErrors.position) {
                        setFormErrors({ ...formErrors, position: undefined });
                      }
                    }}
                    className={formErrors.position ? 'border-red-500' : ''}
                  />
                  {formErrors.position && (
                    <p className="flex items-center gap-1 text-sm text-red-600">
                      <span>⚠</span> {formErrors.position}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Order of lesson in the session (0 = first)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Input
                    id="level"
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={lessonContextForm.level || ''}
                    onChange={(e) => {
                      const value =
                        e.target.value === '' ? null : parseInt(e.target.value);
                      setLessonContextForm({
                        ...lessonContextForm,
                        level: value
                      });
                      if (formErrors.level) {
                        setFormErrors({ ...formErrors, level: undefined });
                      }
                    }}
                    className={formErrors.level ? 'border-red-500' : ''}
                  />
                  {formErrors.level && (
                    <p className="flex items-center gap-1 text-sm text-red-600">
                      <span>⚠</span> {formErrors.level}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Hierarchy level (optional)
                  </p>
                </div>
                {!editingLessonContext && (
                  <div className="space-y-2">
                    <Label htmlFor="parentLessonId">Parent Lesson ID</Label>
                    <Input
                      id="parentLessonId"
                      placeholder="Optional (UUID)"
                      value={lessonContextForm.parentLessonId || ''}
                      onChange={(e) =>
                        setLessonContextForm({
                          ...lessonContextForm,
                          parentLessonId: e.target.value || null
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      Parent lesson context ID (optional)
                    </p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setLessonContextDialogOpen(false);
                  setEditingLessonContext(null);
                  resetLessonContextForm();
                }}
                disabled={
                  createLessonContextMutation.isPending ||
                  updateLessonContextMutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveLessonContext}
                disabled={
                  createLessonContextMutation.isPending ||
                  updateLessonContextMutation.isPending
                }
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {(createLessonContextMutation.isPending ||
                  updateLessonContextMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingLessonContext ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Lesson Context Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lesson Context Details</DialogTitle>
              <DialogDescription>
                View detailed information about the lesson context
              </DialogDescription>
            </DialogHeader>
            {viewingLessonContext && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Title
                  </Label>
                  <p className="text-lg font-medium">
                    {viewingLessonContext.lessonTitle}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Content
                  </Label>
                  <div className="rounded-md border bg-gray-50 p-4">
                    <p className="whitespace-pre-wrap text-gray-700">
                      {viewingLessonContext.lessonContent ||
                        'No content provided'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Position
                    </Label>
                    <Badge variant="outline" className="font-mono text-base">
                      #{viewingLessonContext.position}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Level
                    </Label>
                    <p className="text-sm text-gray-600">
                      {viewingLessonContext.level !== null &&
                      viewingLessonContext.level !== undefined
                        ? `Level ${viewingLessonContext.level}`
                        : 'Not set'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Session ID
                    </Label>
                    <p className="break-all font-mono text-xs text-gray-500">
                      {viewingLessonContext.sessionId}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Parent Lesson ID
                    </Label>
                    <p className="break-all font-mono text-xs text-gray-500">
                      {viewingLessonContext.parentLessonId || 'None'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Created At
                    </Label>
                    <p className="text-sm text-gray-600">
                      {viewingLessonContext.createdAt
                        ? new Date(
                            viewingLessonContext.createdAt
                          ).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Updated At
                    </Label>
                    <p className="text-sm text-gray-600">
                      {viewingLessonContext.updatedAt
                        ? new Date(
                            viewingLessonContext.updatedAt
                          ).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setViewDialogOpen(false);
                  setViewingLessonContext(null);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lesson Context</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the lesson context "
                {lessonContextToDelete?.lessonTitle}"? This action cannot be
                undone and will permanently delete the lesson context and all
                its associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deleteLessonContextMutation.isPending}
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setLessonContextToDelete(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteLessonContextMutation.isPending}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleteLessonContextMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
