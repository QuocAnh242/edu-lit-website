import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  BookOpen,
  ListChecks,
  X
} from 'lucide-react';
import {
  getAllAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getAssessmentQuestionsByAssessmentId,
  createAssessmentQuestions,
  updateAssessmentQuestion,
  deleteAssessmentQuestion,
  AssessmentDto,
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
  AssessmentQuestionDto,
  CreateAssessmentQuestionsRequest,
  UpdateAssessmentQuestionRequest
} from '@/services/assessment.api';
import { getCoursesBySyllabusId, CourseDto } from '@/services/course.api';
import { getAllSyllabuses, SyllabusDto } from '@/services/syllabus.api';
import { getAllQuestions } from '@/services/question.api';
import { QuestionDto } from '@/queries/question.query';
import __helpers from '@/helpers';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssessmentPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userRole = __helpers.getUserRole();

  // Check if user is TEACHER
  if (userRole !== 'TEACHER') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <X className="mx-auto mb-4 h-16 w-16 text-red-500" />
              <h2 className="mb-2 text-2xl font-bold">Access Denied</h2>
              <p className="mb-4 text-gray-600">
                This page is only accessible to TEACHER role.
              </p>
              <Button onClick={() => navigate('/assessments/student')}>
                View Student Assessments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // State
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionsDialogOpen, setQuestionsDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] =
    useState<AssessmentDto | null>(null);
  const [assessmentToDelete, setAssessmentToDelete] =
    useState<AssessmentDto | null>(null);
  const [assessmentForQuestions, setAssessmentForQuestions] =
    useState<AssessmentDto | null>(null);
  const [useManualCourseId, setUseManualCourseId] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [editingQuestion, setEditingQuestion] =
    useState<AssessmentQuestionDto | null>(null);
  const [questionForm, setQuestionForm] = useState<{
    questionId: string;
    orderNum: number;
    correctAnswer: string;
  }>({
    questionId: '',
    orderNum: 1,
    correctAnswer: 'A'
  });
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

  // Fetch courses by getting all syllabuses first, then getting courses for each
  // Since courses are nested under syllabuses in MongoDB, we need to aggregate them
  // NOTE: The API gateway may not route query service endpoints, so this may return empty
  const {
    data: coursesData,
    isLoading: loadingCourses,
    isError: coursesError
  } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        // First, get all active syllabuses
        // This may fail if the query service endpoint isn't routed through the gateway
        const syllabusesResponse = await getAllSyllabuses({
          pageNumber: 1,
          pageSize: 1000,
          isActive: true
        });

        // Check if we got any syllabuses
        if (
          !syllabusesResponse.success ||
          !syllabusesResponse.data ||
          syllabusesResponse.data.items.length === 0
        ) {
          console.warn(
            'No syllabuses available or endpoint not accessible:',
            syllabusesResponse.message
          );
          return {
            success: true,
            message: 'No syllabuses available',
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

        const syllabuses = (syllabusesResponse.data.items ||
          []) as SyllabusDto[];

        // Then, get courses for each syllabus and aggregate them
        const allCourses: CourseDto[] = [];
        for (const syllabus of syllabuses) {
          try {
            const coursesResponse = await getCoursesBySyllabusId(syllabus.id);
            if (coursesResponse.success && coursesResponse.data) {
              allCourses.push(...coursesResponse.data);
            }
          } catch (error) {
            console.warn(
              `Failed to fetch courses for syllabus ${syllabus.id}:`,
              error
            );
            // Continue with other syllabuses even if one fails
          }
        }

        return {
          success: true,
          message: 'Courses fetched successfully',
          data: {
            items: allCourses,
            totalCount: allCourses.length,
            pageNumber: 1,
            pageSize: 100,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false
          }
        };
      } catch (error: unknown) {
        console.error('Error fetching courses:', error);
        // Return empty result instead of throwing error
        // This allows the page to still function even if courses can't be loaded
        return {
          success: true,
          message:
            'Failed to fetch courses - API gateway may not route query service endpoints',
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
    },
    retry: false, // Don't retry if endpoints aren't available
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  const courses = (coursesData?.data?.items || []) as CourseDto[];

  // Fetch assessment questions when questions dialog is open
  const {
    data: assessmentQuestionsData,
    isLoading: loadingAssessmentQuestions
  } = useQuery({
    queryKey: ['assessment-questions', assessmentForQuestions?.assessmentId],
    queryFn: async () => {
      if (!assessmentForQuestions?.assessmentId) return null;
      const response = await getAssessmentQuestionsByAssessmentId(
        assessmentForQuestions.assessmentId
      );
      return response;
    },
    enabled: !!assessmentForQuestions?.assessmentId && questionsDialogOpen
  });

  const assessmentQuestions = (assessmentQuestionsData?.data ||
    assessmentQuestionsData?.Data ||
    []) as AssessmentQuestionDto[];

  // Fetch available questions to add
  const { data: availableQuestionsData, isLoading: loadingAvailableQuestions } =
    useQuery({
      queryKey: ['available-questions'],
      queryFn: async () => {
        const response = await getAllQuestions();
        return response;
      },
      enabled: questionsDialogOpen
    });

  const allQuestions = (
    (availableQuestionsData?.data || []) as QuestionDto[]
  ).filter((q) => q.isPublished);

  const availableQuestions = allQuestions.filter(
    (q) => !assessmentQuestions.some((aq) => aq.questionId === q.questionId)
  );

  // Mutations
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: CreateAssessmentRequest) => {
      const response = await createAssessment(data);
      // Handle both camelCase and PascalCase response properties
      const errorCode = response.errorCode || response.ErrorCode;
      const message = response.message || response.Message;
      const responseData = response.data || response.Data;

      // Check if the response indicates an error
      if (errorCode && errorCode !== '200' && errorCode !== '201') {
        throw new Error(message || 'Failed to create assessment');
      }

      // Return normalized response
      return {
        ...response,
        errorCode: errorCode || '200',
        message: message || 'success',
        data: responseData
      };
    },
    onSuccess: (response) => {
      const responseData = response?.data || response?.Data;
      if (responseData !== undefined && responseData !== null) {
        toast.success('Assessment created successfully');
        queryClient.invalidateQueries({ queryKey: ['assessments'] });
        setAssessmentDialogOpen(false);
        resetAssessmentForm();
      } else {
        const message =
          response?.message ||
          response?.Message ||
          'Failed to create assessment';
        toast.error(message);
      }
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { response?: { data?: { Message?: string } } })?.response
          ?.data?.Message ||
        (error as { message?: string })?.message ||
        (error as { Message?: string })?.Message ||
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

  // Assessment Question Mutations
  const createAssessmentQuestionsMutation = useMutation({
    mutationFn: async (data: CreateAssessmentQuestionsRequest) => {
      const response = await createAssessmentQuestions(data);
      const errorCode = response.errorCode || response.ErrorCode;
      const message = response.message || response.Message;
      if (errorCode && errorCode !== '200' && errorCode !== '201') {
        throw new Error(message || 'Failed to add questions to assessment');
      }
      return response;
    },
    onSuccess: () => {
      toast.success('Questions added to assessment successfully');
      queryClient.invalidateQueries({
        queryKey: ['assessment-questions', assessmentForQuestions?.assessmentId]
      });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setSelectedQuestionIds([]);
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { message?: string })?.message ||
        'Failed to add questions to assessment';
      toast.error(errorMessage);
    }
  });

  const updateAssessmentQuestionMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: number;
      data: UpdateAssessmentQuestionRequest;
    }) => {
      return await updateAssessmentQuestion(id, data);
    },
    onSuccess: () => {
      toast.success('Question updated successfully');
      queryClient.invalidateQueries({
        queryKey: ['assessment-questions', assessmentForQuestions?.assessmentId]
      });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setEditingQuestion(null);
      setQuestionForm({ questionId: '', orderNum: 1, correctAnswer: 'A' });
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { message?: string })?.message || 'Failed to update question';
      toast.error(errorMessage);
    }
  });

  const deleteAssessmentQuestionMutation = useMutation({
    mutationFn: async (assessmentQuestionId: number) => {
      return await deleteAssessmentQuestion(assessmentQuestionId);
    },
    onSuccess: () => {
      toast.success('Question removed from assessment successfully');
      queryClient.invalidateQueries({
        queryKey: ['assessment-questions', assessmentForQuestions?.assessmentId]
      });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { message?: string })?.message ||
        'Failed to remove question from assessment';
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
    setUseManualCourseId(false);
  };

  const handleViewAssessment = (assessment: AssessmentDto) => {
    setAssessmentForQuestions(assessment);
    setQuestionsDialogOpen(true);
    setEditingQuestion(null);
    setQuestionForm({ questionId: '', orderNum: 1, correctAnswer: 'A' });
    setSelectedQuestionIds([]);
  };

  const handleAddQuestion = () => {
    if (!assessmentForQuestions) return;

    if (selectedQuestionIds.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    // Bulk add questions
    createAssessmentQuestionsMutation.mutate({
      assessmentId: assessmentForQuestions.assessmentId,
      questionIds: selectedQuestionIds
    });
  };

  const handleEditQuestion = (question: AssessmentQuestionDto) => {
    setEditingQuestion(question);
    setQuestionForm({
      questionId: question.questionId,
      orderNum: question.orderNum,
      correctAnswer: question.correctAnswer
    });
  };

  const handleUpdateQuestion = () => {
    if (!editingQuestion || !assessmentForQuestions) return;

    updateAssessmentQuestionMutation.mutate({
      id: editingQuestion.assessmentQuestionId,
      data: {
        assessmentQuestionId: editingQuestion.assessmentQuestionId,
        assessmentId: assessmentForQuestions.assessmentId,
        questionId: questionForm.questionId,
        orderNum: questionForm.orderNum,
        correctAnswer: questionForm.correctAnswer
      }
    });
  };

  const handleDeleteQuestion = (question: AssessmentQuestionDto) => {
    if (
      window.confirm(
        `Are you sure you want to remove this question from the assessment?`
      )
    ) {
      deleteAssessmentQuestionMutation.mutate(question.assessmentQuestionId);
    }
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
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (assessments.length > 0) {
                    navigate(
                      `/assessments/${assessments[0].assessmentId}/submissions`
                    );
                  } else {
                    toast.info('Please create an assessment first');
                  }
                }}
                variant="outline"
                className="gap-2 border-cyan-600 text-cyan-600 shadow-md transition-all duration-300 hover:scale-105 hover:bg-cyan-50 hover:shadow-lg"
                disabled={assessments.length === 0}
              >
                <Eye className="h-5 w-5" />
                View Submissions
              </Button>
              <Button
                onClick={handleCreateAssessment}
                className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg transition-all duration-300 hover:scale-105 hover:from-cyan-700 hover:to-blue-700 hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Create Assessment
              </Button>
            </div>
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
                                onClick={() =>
                                  navigate(
                                    `/assessments/${assessment.assessmentId}/submissions`
                                  )
                                }
                                className="transition-all duration-200 hover:scale-110 hover:bg-blue-50"
                                title="View submissions"
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="courseId">Course *</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useManualCourseId"
                      checked={useManualCourseId}
                      onChange={(e) => {
                        setUseManualCourseId(e.target.checked);
                        if (!e.target.checked) {
                          // Reset courseId when switching back to dropdown
                          setAssessmentForm({
                            ...assessmentForm,
                            courseId: ''
                          });
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label
                      htmlFor="useManualCourseId"
                      className="cursor-pointer text-xs text-gray-600"
                    >
                      Manual entry (for testing)
                    </Label>
                  </div>
                </div>
                {useManualCourseId ? (
                  <Input
                    id="courseId"
                    placeholder="Enter course ID (e.g., guid)"
                    value={assessmentForm.courseId}
                    onChange={(e) =>
                      setAssessmentForm({
                        ...assessmentForm,
                        courseId: e.target.value
                      })
                    }
                  />
                ) : (
                  <>
                    <Select
                      value={assessmentForm.courseId}
                      onValueChange={(value) =>
                        setAssessmentForm({
                          ...assessmentForm,
                          courseId: value
                        })
                      }
                      disabled={loadingCourses || coursesError}
                    >
                      <SelectTrigger id="courseId">
                        <SelectValue
                          placeholder={
                            loadingCourses
                              ? 'Loading courses...'
                              : coursesError
                                ? 'Error loading courses'
                                : courses.length === 0
                                  ? 'No courses available'
                                  : 'Select a course'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCourses ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-sm">
                              Loading courses...
                            </span>
                          </div>
                        ) : coursesError ? (
                          <div className="p-4 text-center text-sm text-red-600">
                            Failed to load courses
                          </div>
                        ) : courses.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            No courses available
                          </div>
                        ) : (
                          courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                              {course.courseCode && ` (${course.courseCode})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {coursesError && (
                      <p className="text-xs text-red-500">
                        Unable to load courses. The courses endpoint may not be
                        available.
                      </p>
                    )}
                    {!loadingCourses &&
                      !coursesError &&
                      courses.length === 0 && (
                        <p className="text-xs text-gray-500">
                          No courses available. Courses are managed through
                          syllabuses. Please create a syllabus and add courses
                          to it first.
                        </p>
                      )}
                  </>
                )}
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

        {/* Manage Questions Dialog */}
        <Dialog
          open={questionsDialogOpen}
          onOpenChange={(open) => {
            setQuestionsDialogOpen(open);
            if (!open) {
              setAssessmentForQuestions(null);
              setEditingQuestion(null);
              setQuestionForm({
                questionId: '',
                orderNum: 1,
                correctAnswer: 'A'
              });
              setSelectedQuestionIds([]);
            }
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Manage Questions - {assessmentForQuestions?.title}
              </DialogTitle>
              <DialogDescription>
                Add, update, or remove questions from this assessment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Add Question Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {editingQuestion ? 'Edit Question' : 'Add Question(s)'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingQuestion ? (
                    <>
                      <div className="space-y-2">
                        <Label>Question ID</Label>
                        <Input
                          value={questionForm.questionId}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="orderNum">Order Number *</Label>
                          <Input
                            id="orderNum"
                            type="number"
                            min="1"
                            value={questionForm.orderNum}
                            onChange={(e) =>
                              setQuestionForm({
                                ...questionForm,
                                orderNum: parseInt(e.target.value) || 1
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="correctAnswer">
                            Correct Answer *
                          </Label>
                          <Select
                            value={questionForm.correctAnswer}
                            onValueChange={(value) =>
                              setQuestionForm({
                                ...questionForm,
                                correctAnswer: value
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">A</SelectItem>
                              <SelectItem value="B">B</SelectItem>
                              <SelectItem value="C">C</SelectItem>
                              <SelectItem value="D">D</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateQuestion}
                          disabled={updateAssessmentQuestionMutation.isPending}
                          className="flex-1"
                        >
                          {updateAssessmentQuestionMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Update Question
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingQuestion(null);
                            setQuestionForm({
                              questionId: '',
                              orderNum: 1,
                              correctAnswer: 'A'
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Select Question(s)</Label>
                        {loadingAvailableQuestions ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-sm">
                              Loading questions...
                            </span>
                          </div>
                        ) : availableQuestions.length === 0 ? (
                          <p className="p-4 text-sm text-gray-500">
                            No available questions to add. All published
                            questions are already in this assessment.
                          </p>
                        ) : (
                          <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
                            {availableQuestions.map((question) => (
                              <div
                                key={question.questionId}
                                className="flex items-start gap-2 rounded p-2 hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  id={`question-${question.questionId}`}
                                  checked={selectedQuestionIds.includes(
                                    question.questionId
                                  )}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedQuestionIds([
                                        ...selectedQuestionIds,
                                        question.questionId
                                      ]);
                                    } else {
                                      setSelectedQuestionIds(
                                        selectedQuestionIds.filter(
                                          (id) => id !== question.questionId
                                        )
                                      );
                                    }
                                  }}
                                  className="mt-1 h-4 w-4"
                                />
                                <label
                                  htmlFor={`question-${question.questionId}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="text-sm font-medium">
                                    {question.title}
                                  </div>
                                  <div className="line-clamp-2 text-xs text-gray-500">
                                    {question.body}
                                  </div>
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedQuestionIds.length > 0 && (
                        <div className="space-y-2">
                          <Label>
                            Selected Questions ({selectedQuestionIds.length})
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedQuestionIds.map((id) => {
                              const question = availableQuestions.find(
                                (q) => q.questionId === id
                              );
                              return (
                                <Badge
                                  key={id}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  {question?.title || id}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() =>
                                      setSelectedQuestionIds(
                                        selectedQuestionIds.filter(
                                          (qId) => qId !== id
                                        )
                                      )
                                    }
                                  />
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleAddQuestion}
                        disabled={
                          selectedQuestionIds.length === 0 ||
                          createAssessmentQuestionsMutation.isPending
                        }
                        className="w-full"
                      >
                        {createAssessmentQuestionsMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {selectedQuestionIds.length > 0
                          ? `Add ${selectedQuestionIds.length} Question(s)`
                          : 'Select Questions to Add'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Current Questions List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Current Questions ({assessmentQuestions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingAssessmentQuestions ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : assessmentQuestions.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      <ListChecks className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                      <p>No questions added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assessmentQuestions
                        .sort((a, b) => a.orderNum - b.orderNum)
                        .map((aq) => {
                          const question = allQuestions.find(
                            (q) => q.questionId === aq.questionId
                          );
                          return (
                            <div
                              key={aq.assessmentQuestionId}
                              className="flex items-start justify-between rounded-md border p-3 hover:bg-gray-50"
                            >
                              <div className="flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                  <Badge variant="outline">
                                    Order: {aq.orderNum}
                                  </Badge>
                                  <Badge variant="secondary">
                                    Correct: {aq.correctAnswer}
                                  </Badge>
                                </div>
                                <div className="text-sm font-medium">
                                  {question?.title ||
                                    `Question ID: ${aq.questionId}`}
                                </div>
                                {question?.body && (
                                  <div className="mt-1 line-clamp-2 text-xs text-gray-500">
                                    {question.body}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditQuestion(aq)}
                                  className="h-8 w-8"
                                  title="Edit question"
                                >
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteQuestion(aq)}
                                  disabled={
                                    deleteAssessmentQuestionMutation.isPending
                                  }
                                  className="h-8 w-8"
                                  title="Remove question"
                                >
                                  {deleteAssessmentQuestionMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setQuestionsDialogOpen(false);
                  setAssessmentForQuestions(null);
                  setEditingQuestion(null);
                  setQuestionForm({
                    questionId: '',
                    orderNum: 1,
                    correctAnswer: 'A'
                  });
                  setSelectedQuestionIds([]);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
