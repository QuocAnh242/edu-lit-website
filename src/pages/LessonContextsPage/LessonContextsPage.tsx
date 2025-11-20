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
  BookOpen,
  Edit,
  Trash2,
  Loader2,
  Search,
  ArrowLeft,
  FileText,
  Activity
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
} from '@/services/lessoncontext.api';

export default function LessonContextsPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();

  // State
  const [lessonContextDialogOpen, setLessonContextDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLessonContext, setEditingLessonContext] =
    useState<LessonContextDto | null>(null);
  const [lessonContextToDelete, setLessonContextToDelete] =
    useState<LessonContextDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [lessonContextForm, setLessonContextForm] =
    useState<CreateLessonContextRequest>({
      sessionId: sessionId || '',
      title: '',
      content: '',
      orderIndex: 1,
      subsections: []
    });

  // Fetch lesson contexts for this session
  const {
    data: lessonContextsData,
    isLoading: loadingLessonContexts,
    isError: lessonContextsError
  } = useQuery({
    queryKey: ['lessoncontexts', sessionId, searchTerm],
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
      queryClient.invalidateQueries({ queryKey: ['lessoncontexts'] });
      setLessonContextDialogOpen(false);
      resetLessonContextForm();
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { message?: string })?.message ||
        'Failed to create lesson context';
      toast.error(errorMessage);
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
      queryClient.invalidateQueries({ queryKey: ['lessoncontexts'] });
      setLessonContextDialogOpen(false);
      setEditingLessonContext(null);
      resetLessonContextForm();
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { message?: string })?.message ||
        'Failed to update lesson context';
      toast.error(errorMessage);
    }
  });

  const deleteLessonContextMutation = useMutation({
    mutationFn: async (lessonContextId: string) => {
      return await deleteLessonContext(lessonContextId);
    },
    onSuccess: () => {
      toast.success('Lesson context deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['lessoncontexts'] });
      setDeleteDialogOpen(false);
      setLessonContextToDelete(null);
    },
    onError: (error: unknown) => {
      const errorMessage =
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
      title: lessonContext.title,
      content: lessonContext.content,
      orderIndex: lessonContext.orderIndex,
      subsections: lessonContext.subsections.map((sub) => ({
        id: sub.id,
        title: sub.title,
        content: sub.content,
        orderIndex: sub.orderIndex
      }))
    });
    setLessonContextDialogOpen(true);
  };

  const handleDeleteLessonContext = (lessonContext: LessonContextDto) => {
    setLessonContextToDelete(lessonContext);
    setDeleteDialogOpen(true);
  };

  const handleSaveLessonContext = () => {
    const dataToSend = {
      ...lessonContextForm,
      sessionId: sessionId || ''
    };

    if (editingLessonContext) {
      updateLessonContextMutation.mutate({
        id: editingLessonContext.id,
        data: dataToSend
      });
    } else {
      createLessonContextMutation.mutate(dataToSend);
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
      title: '',
      content: '',
      orderIndex: lessonContexts.length + 1,
      subsections: []
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/course/${sessionId}/sessions`)}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sessions
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 flex items-center gap-2 text-4xl font-bold text-blue-600">
                <FileText className="h-10 w-10" />
                Lesson Contexts
              </h1>
              <p className="text-lg text-gray-600">
                Manage lesson content and subsections
              </p>
            </div>
            <Button
              onClick={handleCreateLessonContext}
              className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              <Plus className="h-5 w-5" />
              Create Lesson Context
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
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
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Lesson Contexts
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {lessonContexts.length}{' '}
                {lessonContexts.length === 1 ? 'Context' : 'Contexts'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingLessonContexts ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
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
                      queryKey: ['lessoncontexts']
                    })
                  }
                  variant="outline"
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
                  <Button onClick={handleCreateLessonContext} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Lesson Context
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Subsections</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessonContexts
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((lessonContext: LessonContextDto) => (
                      <TableRow key={lessonContext.id}>
                        <TableCell>
                          <Badge variant="outline">
                            #{lessonContext.orderIndex}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {lessonContext.title}
                        </TableCell>
                        <TableCell>
                          <div className="line-clamp-2 max-w-md text-sm text-gray-600">
                            {lessonContext.content || 'No content'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {lessonContext.subsections.length} subsections
                          </Badge>
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
                                navigate(
                                  `/lessoncontext/${lessonContext.id}/activities`
                                )
                              }
                              className="transition-all duration-200 hover:scale-110 hover:bg-green-50"
                              title="Activities"
                            >
                              <Activity className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleEditLessonContext(lessonContext)
                              }
                              className="transition-all duration-200 hover:scale-110 hover:bg-blue-50"
                              title="Edit lesson context"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeleteLessonContext(lessonContext)
                              }
                              className="transition-all duration-200 hover:scale-110 hover:bg-red-50"
                              title="Delete lesson context"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Create/Edit Dialog */}
      <Dialog
        open={lessonContextDialogOpen}
        onOpenChange={setLessonContextDialogOpen}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingLessonContext
                ? 'Edit Lesson Context'
                : 'Create Lesson Context'}
            </DialogTitle>
            <DialogDescription>
              {editingLessonContext
                ? 'Update the lesson context information.'
                : 'Create a new lesson context with content and subsections.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter lesson context title"
                value={lessonContextForm.title}
                onChange={(e) =>
                  setLessonContextForm({
                    ...lessonContextForm,
                    title: e.target.value
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter lesson context content"
                value={lessonContextForm.content}
                onChange={(e) =>
                  setLessonContextForm({
                    ...lessonContextForm,
                    content: e.target.value
                  })
                }
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderIndex">Order Index</Label>
              <Input
                id="orderIndex"
                type="number"
                min="1"
                value={lessonContextForm.orderIndex}
                onChange={(e) =>
                  setLessonContextForm({
                    ...lessonContextForm,
                    orderIndex: parseInt(e.target.value) || 1
                  })
                }
              />
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
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLessonContext}
              disabled={
                createLessonContextMutation.isPending ||
                updateLessonContextMutation.isPending
              }
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson Context</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{lessonContextToDelete?.title}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
