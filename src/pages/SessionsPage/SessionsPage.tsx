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
  Eye,
  Loader2,
  Search,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAllSessions,
  createSession,
  updateSession,
  deleteSession,
  getSessionById,
  SessionDto,
  CreateSessionRequest,
  UpdateSessionRequest
} from '@/services/session.api';
import { getCourseById, CourseDto } from '@/services/course.api';

export default function SessionsPage() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();

  // State
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionDto | null>(null);
  const [viewingSession, setViewingSession] = useState<SessionDto | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<SessionDto | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionForm, setSessionForm] = useState<CreateSessionRequest>({
    courseId: courseId || '',
    title: '',
    description: '',
    position: 1,
    durationMinutes: undefined
  });
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    position?: string;
    durationMinutes?: string;
  }>({});

  // Fetch course details
  const { data: courseData, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');
      return await getCourseById(courseId);
    },
    enabled: !!courseId
  });

  const course = courseData?.data as CourseDto | undefined;

  // Fetch sessions for this course
  const {
    data: sessionsData,
    isLoading: loadingSessions,
    isError: sessionsError
  } = useQuery({
    queryKey: ['sessions', courseId, searchTerm],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');
      return await getAllSessions({
        pageNumber: 1,
        pageSize: 100,
        courseId: courseId,
        searchTerm: searchTerm || undefined
      });
    },
    enabled: !!courseId
  });

  const sessions = useMemo(() => {
    return (sessionsData?.data?.items || []) as SessionDto[];
  }, [sessionsData?.data?.items]);

  // Mutations
  const createSessionMutation = useMutation({
    mutationFn: async (data: CreateSessionRequest) => {
      return await createSession(data);
    },
    onSuccess: () => {
      toast.success('Session created successfully');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setSessionDialogOpen(false);
      resetSessionForm();
    },
    onError: (error: unknown) => {
      const apiError = error as {
        message?: string;
        errors?: string[];
        errorCode?: string | number;
      };

      let errorMessage = apiError?.message || 'Failed to create session';

      if (apiError?.errors && apiError.errors.length > 0) {
        errorMessage = apiError.errors.join(', ');
      }

      toast.error(errorMessage, {
        duration: 5000
      });
      console.error('Create Session Error:', error);
    }
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: UpdateSessionRequest;
    }) => {
      return await updateSession(id, data);
    },
    onSuccess: () => {
      toast.success('Session updated successfully');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setSessionDialogOpen(false);
      setEditingSession(null);
      resetSessionForm();
    },
    onError: (error: unknown) => {
      const apiError = error as {
        message?: string;
        errors?: string[];
        errorCode?: string | number;
      };

      let errorMessage = apiError?.message || 'Failed to update session';

      if (apiError?.errors && apiError.errors.length > 0) {
        errorMessage = apiError.errors.join(', ');
      }

      toast.error(errorMessage, {
        duration: 5000
      });
      console.error('Update Session Error:', error);
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await deleteSession(sessionId);
    },
    onSuccess: () => {
      toast.success('Session deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to delete session';
      toast.error(errorMessage);
    }
  });

  // Handlers
  const handleCreateSession = () => {
    setEditingSession(null);
    resetSessionForm();
    setSessionDialogOpen(true);
  };

  const handleEditSession = (session: SessionDto) => {
    setEditingSession(session);
    setSessionForm({
      courseId: session.courseId,
      title: session.title,
      description: session.description || '',
      position: session.position,
      durationMinutes: session.durationMinutes
    });
    setSessionDialogOpen(true);
  };

  const handleDeleteSession = (session: SessionDto) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const handleViewSession = async (session: SessionDto) => {
    try {
      const response = await getSessionById(session.id);
      if (response.success && response.data) {
        setViewingSession(response.data);
        setViewDialogOpen(true);
      } else {
        toast.error('Failed to load session details');
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
      toast.error('Failed to load session details');
    }
  };

  const handleViewLessonContexts = (session: SessionDto) => {
    navigate(`/session/${session.id}/lesson-contexts`);
  };

  const validateSessionForm = (): {
    isValid: boolean;
    errors: { title?: string; position?: string; durationMinutes?: string };
  } => {
    const errors: {
      title?: string;
      position?: string;
      durationMinutes?: string;
    } = {};

    // Validate Title
    if (!sessionForm.title.trim()) {
      errors.title = 'Title is required';
    } else if (sessionForm.title.trim().length > 200) {
      errors.title = 'Title cannot exceed 200 characters';
    }

    // Validate Position
    if (sessionForm.position < 0) {
      errors.position = 'Position must be greater than or equal to 0';
    }

    // Validate DurationMinutes
    if (
      sessionForm.durationMinutes !== undefined &&
      sessionForm.durationMinutes <= 0
    ) {
      errors.durationMinutes = 'Duration must be greater than 0 if provided';
    }

    setFormErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleSaveSession = () => {
    setFormErrors({});

    const validation = validateSessionForm();
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    const dataToSend: CreateSessionRequest | UpdateSessionRequest = {
      title: sessionForm.title.trim(),
      description: sessionForm.description?.trim() || '',
      position: sessionForm.position,
      durationMinutes: sessionForm.durationMinutes
    };

    if (editingSession) {
      updateSessionMutation.mutate({
        id: editingSession.id,
        data: dataToSend
      });
    } else {
      createSessionMutation.mutate({
        ...dataToSend,
        courseId: courseId || ''
      } as CreateSessionRequest);
    }
  };

  const handleDeleteConfirm = () => {
    if (sessionToDelete) {
      deleteSessionMutation.mutate(sessionToDelete.id);
    }
  };

  const resetSessionForm = () => {
    setSessionForm({
      courseId: courseId || '',
      title: '',
      description: '',
      position: sessions.length + 1,
      durationMinutes: undefined
    });
    setFormErrors({});
  };

  // Update position when sessions change
  React.useEffect(() => {
    if (!editingSession && sessions.length > 0) {
      setSessionForm((prev) => ({
        ...prev,
        position: Math.max(...sessions.map((s) => s.position), 0) + 1
      }));
    }
  }, [sessions, editingSession]);

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
              onClick={() => navigate('/course')}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 flex items-center gap-2 text-4xl font-bold text-purple-600">
                  <BookOpen className="h-10 w-10 transition-transform hover:scale-110" />
                  Sessions
                </h1>
                {loadingCourse ? (
                  <Skeleton className="h-6 w-64" />
                ) : course ? (
                  <p className="text-lg text-gray-600">
                    Manage sessions for:{' '}
                    <span className="font-semibold">{course.title}</span>
                  </p>
                ) : (
                  <p className="text-lg text-gray-600">
                    Manage course sessions
                  </p>
                )}
              </div>
              <Button
                onClick={handleCreateSession}
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg transition-all duration-300 hover:scale-105 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Create Session
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
                    placeholder="Search sessions by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions Table */}
          <Card
            className="animate-slide-in shadow-lg transition-all duration-300 hover:shadow-2xl"
            style={{ animationDelay: '0.2s', opacity: 0 }}
          >
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 transition-transform hover:scale-110" />
                  All Sessions
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {sessions.length}{' '}
                  {sessions.length === 1 ? 'Session' : 'Sessions'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSessions ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              ) : sessionsError ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <BookOpen className="mb-4 h-16 w-16 text-red-300" />
                  <h3 className="mb-2 text-xl font-semibold text-red-700">
                    Error loading sessions
                  </h3>
                  <p className="mb-4 text-gray-500">
                    An error occurred while loading sessions. Please try again.
                  </p>
                  <Button
                    onClick={() =>
                      queryClient.invalidateQueries({ queryKey: ['sessions'] })
                    }
                    variant="outline"
                    className="gap-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <BookOpen className="mb-4 h-16 w-16 text-gray-300" />
                  <h3 className="mb-2 text-xl font-semibold text-gray-700">
                    No sessions yet
                  </h3>
                  <p className="mb-4 text-gray-500">
                    {searchTerm
                      ? 'No sessions found matching your search.'
                      : 'Get started by creating your first session'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleCreateSession} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create First Session
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[10%]">Position</TableHead>
                      <TableHead className="w-[30%]">Title</TableHead>
                      <TableHead className="w-[35%]">Description</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions
                      .sort((a, b) => a.position - b.position)
                      .map((session: SessionDto) => (
                        <TableRow
                          key={session.id}
                          className="transition-colors duration-200 hover:bg-purple-50"
                        >
                          <TableCell className="font-medium">
                            <Badge variant="outline" className="font-mono">
                              #{session.position}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            <button
                              onClick={() => handleViewLessonContexts(session)}
                              className="cursor-pointer text-left text-sm font-semibold underline-offset-2 transition-colors hover:text-purple-600 hover:underline"
                              title="Click to view lesson contexts"
                            >
                              {session.title}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="line-clamp-2 max-w-md text-sm text-gray-600">
                              {session.description || 'No description'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {session.durationMinutes ? (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                {session.durationMinutes} min
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">
                                Not set
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {session.createdAt
                              ? new Date(session.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewSession(session)}
                                className="transition-all duration-200 hover:scale-110 hover:bg-blue-50"
                                title="View session"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditSession(session)}
                                className="transition-all duration-200 hover:scale-110 hover:bg-green-50"
                                title="Edit session"
                              >
                                <Edit className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSession(session)}
                                disabled={deleteSessionMutation.isPending}
                                className="transition-all duration-200 hover:scale-110 hover:bg-red-50"
                                title="Delete session"
                              >
                                {deleteSessionMutation.isPending &&
                                sessionToDelete?.id === session.id ? (
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

        {/* Session Create/Edit Dialog */}
        <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSession ? 'Edit Session' : 'Create Session'}
              </DialogTitle>
              <DialogDescription>
                {editingSession
                  ? 'Update the session information.'
                  : 'Create a new session for this course.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter session title (max 200 characters)"
                  value={sessionForm.title}
                  onChange={(e) => {
                    setSessionForm({ ...sessionForm, title: e.target.value });
                    if (formErrors.title) {
                      setFormErrors({ ...formErrors, title: undefined });
                    }
                  }}
                  className={formErrors.title ? 'border-red-500' : ''}
                  maxLength={200}
                />
                {formErrors.title && (
                  <p className="flex items-center gap-1 text-sm text-red-600">
                    <span>⚠</span> {formErrors.title}
                  </p>
                )}
                {!formErrors.title && sessionForm.title && (
                  <p className="text-xs text-gray-500">
                    {sessionForm.title.length}/200 characters
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter session description (optional, max 1000 characters)"
                  value={sessionForm.description}
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
                      description: e.target.value
                    })
                  }
                  rows={4}
                  maxLength={1000}
                />
                {sessionForm.description && (
                  <p className="text-xs text-gray-500">
                    {sessionForm.description.length}/1000 characters
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    type="number"
                    min="0"
                    placeholder="1"
                    value={sessionForm.position}
                    onChange={(e) => {
                      setSessionForm({
                        ...sessionForm,
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
                    Order of session in the course (0 = first)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="1"
                    placeholder="Optional"
                    value={sessionForm.durationMinutes || ''}
                    onChange={(e) => {
                      const value =
                        e.target.value === ''
                          ? undefined
                          : parseInt(e.target.value);
                      setSessionForm({
                        ...sessionForm,
                        durationMinutes: value
                      });
                      if (formErrors.durationMinutes) {
                        setFormErrors({
                          ...formErrors,
                          durationMinutes: undefined
                        });
                      }
                    }}
                    className={
                      formErrors.durationMinutes ? 'border-red-500' : ''
                    }
                  />
                  {formErrors.durationMinutes && (
                    <p className="flex items-center gap-1 text-sm text-red-600">
                      <span>⚠</span> {formErrors.durationMinutes}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Duration in minutes (optional)
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSessionDialogOpen(false);
                  setEditingSession(null);
                  resetSessionForm();
                }}
                disabled={
                  createSessionMutation.isPending ||
                  updateSessionMutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSession}
                disabled={
                  createSessionMutation.isPending ||
                  updateSessionMutation.isPending
                }
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {(createSessionMutation.isPending ||
                  updateSessionMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingSession ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Session Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Session Details</DialogTitle>
              <DialogDescription>
                View detailed information about the session
              </DialogDescription>
            </DialogHeader>
            {viewingSession && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Title
                  </Label>
                  <p className="text-lg font-medium">{viewingSession.title}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Description
                  </Label>
                  <p className="text-gray-600">
                    {viewingSession.description || 'No description provided'}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Position
                    </Label>
                    <Badge variant="outline" className="font-mono text-base">
                      #{viewingSession.position}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Duration
                    </Label>
                    <p className="text-sm text-gray-600">
                      {viewingSession.durationMinutes
                        ? `${viewingSession.durationMinutes} minutes`
                        : 'Not set'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Course ID
                    </Label>
                    <p className="break-all font-mono text-xs text-gray-500">
                      {viewingSession.courseId}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Created At
                    </Label>
                    <p className="text-sm text-gray-600">
                      {viewingSession.createdAt
                        ? new Date(viewingSession.createdAt).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Updated At
                    </Label>
                    <p className="text-sm text-gray-600">
                      {viewingSession.updatedAt
                        ? new Date(viewingSession.updatedAt).toLocaleString()
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
                  setViewingSession(null);
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
              <AlertDialogTitle>Delete Session</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the session "
                {sessionToDelete?.title}"? This action cannot be undone and will
                permanently delete the session and all its associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deleteSessionMutation.isPending}
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSessionToDelete(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteSessionMutation.isPending}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleteSessionMutation.isPending ? (
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
