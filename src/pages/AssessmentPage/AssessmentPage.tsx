import React, { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
  FileText,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Clock,
  BookOpen
} from 'lucide-react';
import {
  getAllAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  AssessmentDto,
  CreateAssessmentRequest,
  UpdateAssessmentRequest
} from '@/services/assessment.api';
import { getAllCourses, CourseDto } from '@/services/course.api';
import __helpers from '@/helpers';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssessmentPage() {
  const queryClient = useQueryClient();

  // State
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] =
    useState<AssessmentDto | null>(null);
  const [assessmentToDelete, setAssessmentToDelete] =
    useState<AssessmentDto | null>(null);
  const [assessmentForm, setAssessmentForm] = useState<CreateAssessmentRequest>(
    {
      courseId: '',
      creatorId: '',
      title: '',
      description: '',
      totalQuestions: 0,
      durationMinutes: 0
    }
  );

  // Fetch assessments
  const {
    data: assessmentsData,
    isLoading: loadingAssessments,
    isError: assessmentsError
  } = useQuery({
    queryKey: ['assessments'],
    queryFn: async () => {
      const response = await getAllAssessments();
      return response;
    }
  });

  const assessments = (assessmentsData?.data || []) as AssessmentDto[];

  // Fetch courses
  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        const response = await getAllCourses({
          pageNumber: 1,
          pageSize: 100
        });
        return response;
      } catch (error) {
        console.error('Error fetching courses:', error);
        return {
          success: false,
          message: 'Failed to fetch courses',
          data: {
            items: [],
            totalCount: 0,
            pageNumber: 1,
            pageSize: 100,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false
          }
        };
      }
    }
  });

  const courses = (coursesData?.data?.items || []) as CourseDto[];

  // Mutations
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: CreateAssessmentRequest) => {
      return await createAssessment(data);
    },
    onSuccess: () => {
      toast.success('Assessment created successfully');
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setAssessmentDialogOpen(false);
      resetAssessmentForm();
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to create assessment';
      toast.error(errorMessage);
    }
  });

  const updateAssessmentMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: number;
      data: UpdateAssessmentRequest;
    }) => {
      return await updateAssessment(id, data);
    },
    onSuccess: () => {
      toast.success('Assessment updated successfully');
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setAssessmentDialogOpen(false);
      setEditingAssessment(null);
      resetAssessmentForm();
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to update assessment';
      toast.error(errorMessage);
    }
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: async (assessmentId: number) => {
      return await deleteAssessment(assessmentId);
    },
    onSuccess: () => {
      toast.success('Assessment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to delete assessment';
      toast.error(errorMessage);
    }
  });

  // Handlers
  const handleCreateAssessment = () => {
    const userId = __helpers.getUserId();
    if (!userId) {
      toast.error('User not authenticated. Please login.');
      return;
    }
    setEditingAssessment(null);
    resetAssessmentForm();
    setAssessmentForm((prev) => ({ ...prev, creatorId: userId }));
    setAssessmentDialogOpen(true);
  };

  const handleEditAssessment = (assessment: AssessmentDto) => {
    const userId = __helpers.getUserId();
    if (!userId) {
      toast.error('User not authenticated. Please login.');
      return;
    }
    setEditingAssessment(assessment);
    setAssessmentForm({
      courseId: assessment.courseId,
      creatorId: userId,
      title: assessment.title,
      description: assessment.description || '',
      totalQuestions: assessment.totalQuestions,
      durationMinutes: assessment.durationMinutes
    });
    setAssessmentDialogOpen(true);
  };

  const handleDeleteAssessment = (assessment: AssessmentDto) => {
    setAssessmentToDelete(assessment);
    setDeleteDialogOpen(true);
  };

  const handleSaveAssessment = () => {
    if (!assessmentForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!assessmentForm.courseId) {
      toast.error('Please select a course');
      return;
    }
    if (assessmentForm.totalQuestions <= 0) {
      toast.error('Total questions must be greater than 0');
      return;
    }
    if (assessmentForm.durationMinutes <= 0) {
      toast.error('Duration must be greater than 0');
      return;
    }

    if (editingAssessment) {
      updateAssessmentMutation.mutate({
        id: editingAssessment.assessmentId,
        data: {
          id: editingAssessment.assessmentId,
          courseId: assessmentForm.courseId,
          creatorId: assessmentForm.creatorId,
          title: assessmentForm.title,
          description: assessmentForm.description,
          totalQuestions: assessmentForm.totalQuestions,
          durationMinutes: assessmentForm.durationMinutes
        }
      });
    } else {
      createAssessmentMutation.mutate(assessmentForm);
    }
  };

  const handleDeleteConfirm = () => {
    if (assessmentToDelete) {
      deleteAssessmentMutation.mutate(assessmentToDelete.assessmentId);
    }
  };

  const resetAssessmentForm = () => {
    const userId = __helpers.getUserId();
    setAssessmentForm({
      courseId: '',
      creatorId: userId || '',
      title: '',
      description: '',
      totalQuestions: 0,
      durationMinutes: 0
    });
  };

  const handleViewAssessment = (assessment: AssessmentDto) => {
    // TODO: Navigate to assessment detail page when implemented
    toast.info('View assessment feature coming soon', {
      description: `Assessment: ${assessment.title}`
    });
    // navigate(`/assessments/${assessment.assessmentId}`);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getStatusBadge = (status?: string, isActive?: boolean) => {
    if (isActive === false) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    switch (status?.toLowerCase()) {
      case 'public':
        return (
          <Badge className="bg-green-600 hover:bg-green-700">Public</Badge>
        );
      case 'private':
        return <Badge variant="outline">Private</Badge>;
      case 'onhold':
        return <Badge variant="secondary">On Hold</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
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
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.3s ease-out forwards; }
      `}</style>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="animate-fade-in-up mb-8 flex items-center justify-between">
            <div>
              <h1
                className="mb-2 flex items-center gap-2 text-4xl font-bold text-cyan-600"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                <FileText className="h-10 w-10 transition-transform hover:scale-110" />
                Assessments
              </h1>
              <p
                className="text-lg text-gray-600"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                Manage your assessments and assignments
              </p>
            </div>
            <Button
              onClick={handleCreateAssessment}
              className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg transition-all duration-300 hover:scale-105 hover:from-cyan-700 hover:to-blue-700 hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Create Assessment
            </Button>
          </div>

          {/* Assessments Table */}
          <Card
            className="animate-slide-in shadow-lg transition-all duration-300 hover:shadow-2xl"
            style={{ animationDelay: '0.1s', opacity: 0 }}
          >
            <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 transition-transform hover:scale-110" />
                  All Assessments
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {assessments.length}{' '}
                  {assessments.length === 1 ? 'Assessment' : 'Assessments'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAssessments ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              ) : assessmentsError ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <FileText className="mb-4 h-16 w-16 text-red-300" />
                  <h3 className="mb-2 text-xl font-semibold text-red-700">
                    Error loading assessments
                  </h3>
                  <p className="mb-4 text-gray-500">
                    An error occurred while loading assessments. Please try
                    again.
                  </p>
                  <Button
                    onClick={() =>
                      queryClient.invalidateQueries({
                        queryKey: ['assessments']
                      })
                    }
                    variant="outline"
                    className="gap-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : assessments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <FileText className="mb-4 h-16 w-16 text-gray-300" />
                  <h3 className="mb-2 text-xl font-semibold text-gray-700">
                    No assessments yet
                  </h3>
                  <p className="mb-4 text-gray-500">
                    Get started by creating your first assessment
                  </p>
                  <Button onClick={handleCreateAssessment} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Assessment
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Title</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((assessment: AssessmentDto) => {
                      const course = courses.find(
                        (c) => c.id === assessment.courseId
                      );
                      return (
                        <TableRow
                          key={assessment.assessmentId}
                          className="transition-colors duration-200 hover:bg-cyan-50"
                        >
                          <TableCell className="font-medium">
                            <div>
                              <div className="text-sm font-semibold">
                                {assessment.title}
                              </div>
                              {assessment.description && (
                                <div className="mt-1 line-clamp-1 text-xs text-gray-500">
                                  {assessment.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {course ? (
                              <div className="text-sm">
                                <div className="font-medium">
                                  {course.title}
                                </div>
                                {course.courseCode && (
                                  <div className="text-xs text-gray-500">
                                    {course.courseCode}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">
                                Unknown Course
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <BookOpen className="h-4 w-4 text-gray-400" />
                              {assessment.totalQuestions}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-4 w-4 text-gray-400" />
                              {formatDuration(assessment.durationMinutes)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(
                              assessment.status,
                              assessment.isActive
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {assessment.createdAt
                              ? new Date(
                                  assessment.createdAt
                                ).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewAssessment(assessment)}
                                className="transition-all duration-200 hover:scale-110 hover:bg-blue-50"
                                title="View assessment"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditAssessment(assessment)}
                                className="transition-all duration-200 hover:scale-110 hover:bg-green-50"
                                title="Edit assessment"
                              >
                                <Edit className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleDeleteAssessment(assessment)
                                }
                                disabled={deleteAssessmentMutation.isPending}
                                className="transition-all duration-200 hover:scale-110 hover:bg-red-50"
                                title="Delete assessment"
                              >
                                {deleteAssessmentMutation.isPending &&
                                assessmentToDelete?.assessmentId ===
                                  assessment.assessmentId ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards */}
          {!loadingAssessments && assessments.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card
                className="animate-scale-in border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ animationDelay: '0.2s', opacity: 0 }}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-cyan-700">
                    Total Assessments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-cyan-600">
                    {assessments.length}
                  </div>
                </CardContent>
              </Card>
              <Card
                className="animate-scale-in border-green-200 bg-gradient-to-br from-green-50 to-green-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ animationDelay: '0.3s', opacity: 0 }}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-green-700">
                    Active Assessments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {
                      assessments.filter(
                        (a: AssessmentDto) => a.isActive !== false
                      ).length
                    }
                  </div>
                </CardContent>
              </Card>
              <Card
                className="animate-scale-in border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ animationDelay: '0.4s', opacity: 0 }}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-blue-700">
                    Total Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {assessments.reduce(
                      (sum, a: AssessmentDto) => sum + a.totalQuestions,
                      0
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        {/* Assessment Create/Edit Dialog */}
        <Dialog
          open={assessmentDialogOpen}
          onOpenChange={setAssessmentDialogOpen}
        >
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAssessment ? 'Edit Assessment' : 'Create Assessment'}
              </DialogTitle>
              <DialogDescription>
                {editingAssessment
                  ? 'Update the assessment information.'
                  : 'Create a new assessment for your course.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter assessment title"
                  value={assessmentForm.title}
                  onChange={(e) =>
                    setAssessmentForm({
                      ...assessmentForm,
                      title: e.target.value
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseId">Course *</Label>
                <Select
                  value={assessmentForm.courseId}
                  onValueChange={(value) =>
                    setAssessmentForm({ ...assessmentForm, courseId: value })
                  }
                  disabled={loadingCourses}
                >
                  <SelectTrigger id="courseId">
                    <SelectValue
                      placeholder={
                        loadingCourses
                          ? 'Loading courses...'
                          : 'Select a course'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                        {course.courseCode && ` (${course.courseCode})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter assessment description"
                  value={assessmentForm.description}
                  onChange={(e) =>
                    setAssessmentForm({
                      ...assessmentForm,
                      description: e.target.value
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalQuestions">Total Questions *</Label>
                  <Input
                    id="totalQuestions"
                    type="number"
                    min="1"
                    placeholder="Number of questions"
                    value={assessmentForm.totalQuestions}
                    onChange={(e) =>
                      setAssessmentForm({
                        ...assessmentForm,
                        totalQuestions: parseInt(e.target.value) || 0
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duration (minutes) *</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="1"
                    placeholder="Duration in minutes"
                    value={assessmentForm.durationMinutes}
                    onChange={(e) =>
                      setAssessmentForm({
                        ...assessmentForm,
                        durationMinutes: parseInt(e.target.value) || 0
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAssessmentDialogOpen(false);
                  setEditingAssessment(null);
                  resetAssessmentForm();
                }}
                disabled={
                  createAssessmentMutation.isPending ||
                  updateAssessmentMutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAssessment}
                disabled={
                  createAssessmentMutation.isPending ||
                  updateAssessmentMutation.isPending ||
                  !assessmentForm.title.trim() ||
                  !assessmentForm.courseId ||
                  assessmentForm.totalQuestions <= 0 ||
                  assessmentForm.durationMinutes <= 0
                }
                className="bg-gradient-to-r from-cyan-600 to-blue-600"
              >
                {(createAssessmentMutation.isPending ||
                  updateAssessmentMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingAssessment ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the assessment "
                {assessmentToDelete?.title}"? This action cannot be undone and
                will permanently delete the assessment and all its associated
                data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deleteAssessmentMutation.isPending}
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setAssessmentToDelete(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteAssessmentMutation.isPending}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleteAssessmentMutation.isPending ? (
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
