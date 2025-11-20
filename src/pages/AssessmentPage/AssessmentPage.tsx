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
  X,
  PlusCircle,
  CheckCircle2
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
import { getAllCourses, CourseDto } from '@/services/course.api';
import {
  getAllQuestions,
  getQuestionsByQuestionBankId,
  getQuestionById,
  getQuestionOptionsByQuestionId,
  QuestionOptionDto
} from '@/services/question.api';
import { QuestionDto, QuestionBankDto } from '@/queries/question.query';
import { getAllQuestionBanks } from '@/services/question-bank.api';
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
  const [addQuestionsDialogOpen, setAddQuestionsDialogOpen] = useState(false);
  const [viewQuestionsDialogOpen, setViewQuestionsDialogOpen] = useState(false);
  const [assessmentForViewQuestions, setAssessmentForViewQuestions] =
    useState<AssessmentDto | null>(null);
  const [editingAssessment, setEditingAssessment] =
    useState<AssessmentDto | null>(null);
  const [assessmentToDelete, setAssessmentToDelete] =
    useState<AssessmentDto | null>(null);
  const [assessmentForQuestions, setAssessmentForQuestions] =
    useState<AssessmentDto | null>(null);
  const [assessmentForAddQuestions, setAssessmentForAddQuestions] =
    useState<AssessmentDto | null>(null);
  const [selectedQuestionBankId, setSelectedQuestionBankId] =
    useState<string>('');
  const [selectedQuestionIdsFromBank, setSelectedQuestionIdsFromBank] =
    useState<string[]>([]);
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

  // Fetch all courses using the new getAllCourses API
  const {
    data: coursesData,
    isLoading: loadingCourses,
    isError: coursesError
  } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      console.log('[AssessmentPage] Fetching courses...');
      try {
        const response = await getAllCourses();
        console.log('[AssessmentPage] Courses response received:', response);
        console.log('[AssessmentPage] Response success:', response?.success);
        console.log('[AssessmentPage] Response data:', response?.data);
        console.log(
          '[AssessmentPage] Response data type:',
          typeof response?.data
        );
        console.log(
          '[AssessmentPage] Response data is array?',
          Array.isArray(response?.data)
        );
        console.log(
          '[AssessmentPage] Number of courses:',
          response?.data?.length || 0
        );
        return response;
      } catch (error) {
        console.error('[AssessmentPage] Error fetching courses:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  console.log('[AssessmentPage] Courses query state:', {
    isLoading: loadingCourses,
    isError: coursesError,
    coursesData,
    coursesDataType: typeof coursesData,
    coursesDataData: coursesData?.data,
    coursesDataDataType: typeof coursesData?.data
  });

  const courses = (coursesData?.data || []) as CourseDto[];

  console.log('[AssessmentPage] Processed courses array:', courses);
  console.log('[AssessmentPage] Number of courses to display:', courses.length);

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

  // Fetch question banks for add questions dialog
  const { data: questionBanksData, isLoading: loadingQuestionBanks } = useQuery(
    {
      queryKey: ['question-banks'],
      queryFn: async () => {
        const response = await getAllQuestionBanks();
        return response;
      },
      enabled: addQuestionsDialogOpen
    }
  );

  const questionBanks = (questionBanksData?.data || []) as QuestionBankDto[];

  // Fetch questions from selected question bank
  const { data: questionsFromBankData, isLoading: loadingQuestionsFromBank } =
    useQuery({
      queryKey: ['questions-from-bank', selectedQuestionBankId],
      queryFn: async () => {
        if (!selectedQuestionBankId) return null;
        const response = await getQuestionsByQuestionBankId(
          selectedQuestionBankId
        );
        return response;
      },
      enabled: addQuestionsDialogOpen && !!selectedQuestionBankId
    });

  // Fetch current assessment questions for validation when adding questions from bank
  const { data: currentAssessmentQuestionsData } = useQuery({
    queryKey: ['assessment-questions', assessmentForAddQuestions?.assessmentId],
    queryFn: async () => {
      if (!assessmentForAddQuestions?.assessmentId) return null;
      const response = await getAssessmentQuestionsByAssessmentId(
        assessmentForAddQuestions.assessmentId
      );
      return response;
    },
    enabled: addQuestionsDialogOpen && !!assessmentForAddQuestions?.assessmentId
  });

  const currentAssessmentQuestions = (currentAssessmentQuestionsData?.data ||
    currentAssessmentQuestionsData?.Data ||
    []) as AssessmentQuestionDto[];

  const questionsFromBankRaw = (questionsFromBankData?.data ||
    []) as QuestionDto[];

  // Filter out questions that are already in the assessment and only show published questions
  const questionsFromBank = questionsFromBankRaw.filter((q) => {
    if (!q.isPublished) return false;
    // Check if question is already in the assessment
    return !currentAssessmentQuestions.some(
      (aq) => aq.questionId === q.questionId
    );
  });

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
      console.error('Create Assessment Error Details:', error);

      // Try to extract detailed error information
      let errorMessage = 'Failed to create assessment';

      // Check for response data message
      const responseData = (
        error as {
          response?: {
            data?: {
              message?: string;
              Message?: string;
              errorCode?: string;
              ErrorCode?: string;
            };
          };
        }
      )?.response?.data;
      if (responseData) {
        errorMessage =
          responseData.message || responseData.Message || errorMessage;
      }

      // Check for direct message
      if (!errorMessage || errorMessage === 'Failed to create assessment') {
        errorMessage =
          (error as { message?: string })?.message ||
          (error as { Message?: string })?.Message ||
          errorMessage;
      }

      // Check for inner exception or detailed error
      const innerError = (
        error as {
          response?: {
            data?: { innerException?: string; InnerException?: string };
          };
        }
      )?.response?.data;
      if (innerError?.innerException || innerError?.InnerException) {
        errorMessage += `\nDetails: ${innerError.innerException || innerError.InnerException}`;
      }

      // Log full error for debugging
      console.error('Full error object:', JSON.stringify(error, null, 2));

      toast.error(`Failed to create assessment: ${errorMessage}`, {
        duration: 5000,
        description:
          'Please check that the course ID exists and try again. You can use "Manual entry" to enter a valid course ID.'
      });
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
    onSuccess: (_, variables) => {
      toast.success('Questions added to assessment successfully');
      // Invalidate queries for the assessment that was updated
      queryClient.invalidateQueries({
        queryKey: ['assessment-questions', variables.assessmentId]
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
    // Validate all required fields
    if (!assessmentForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!assessmentForm.courseId) {
      toast.error('Please select a course');
      return;
    }
    if (!assessmentForm.creatorId) {
      toast.error('User not authenticated. Please login again.');
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

    console.log('Creating assessment with data:', assessmentForm);

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

  const handleAddQuestionsFromBank = (assessment: AssessmentDto) => {
    setAssessmentForAddQuestions(assessment);
    setSelectedQuestionBankId('');
    setSelectedQuestionIdsFromBank([]);
    setAddQuestionsDialogOpen(true);
  };

  const handleViewQuestions = (assessment: AssessmentDto) => {
    setAssessmentForViewQuestions(assessment);
    setViewQuestionsDialogOpen(true);
  };

  const handleAddQuestionsFromBankSubmit = () => {
    if (!assessmentForAddQuestions) return;

    if (selectedQuestionIdsFromBank.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    // Validate total questions limit
    const currentQuestionCount = currentAssessmentQuestions.length;
    const questionsToAdd = selectedQuestionIdsFromBank.length;
    const totalAfterAdd = currentQuestionCount + questionsToAdd;
    const maxQuestions = assessmentForAddQuestions.totalQuestions;

    if (totalAfterAdd > maxQuestions) {
      const remaining = maxQuestions - currentQuestionCount;
      toast.error(
        `Cannot add ${questionsToAdd} question(s). Assessment can only contain ${maxQuestions} question(s). ` +
          `Currently has ${currentQuestionCount} question(s). ` +
          `You can add at most ${remaining} more question(s).`
      );
      return;
    }

    // Bulk add questions
    createAssessmentQuestionsMutation.mutate(
      {
        assessmentId: assessmentForAddQuestions.assessmentId,
        questionIds: selectedQuestionIdsFromBank
      },
      {
        onSuccess: () => {
          setAddQuestionsDialogOpen(false);
          setAssessmentForAddQuestions(null);
          setSelectedQuestionBankId('');
          setSelectedQuestionIdsFromBank([]);
        }
      }
    );
  };

  const handleAddQuestion = () => {
    if (!assessmentForQuestions) return;

    if (selectedQuestionIds.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    // Validate total questions limit
    const currentQuestionCount = assessmentQuestions.length;
    const questionsToAdd = selectedQuestionIds.length;
    const totalAfterAdd = currentQuestionCount + questionsToAdd;
    const maxQuestions = assessmentForQuestions.totalQuestions;

    if (totalAfterAdd > maxQuestions) {
      const remaining = maxQuestions - currentQuestionCount;
      toast.error(
        `Cannot add ${questionsToAdd} question(s). Assessment can only contain ${maxQuestions} question(s). ` +
          `Currently has ${currentQuestionCount} question(s). ` +
          `You can add at most ${remaining} more question(s).`
      );
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
                                onClick={() => handleViewQuestions(assessment)}
                                className="transition-all duration-200 hover:scale-110 hover:bg-cyan-50"
                                title="View questions"
                              >
                                <ListChecks className="h-4 w-4 text-cyan-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleAddQuestionsFromBank(assessment)
                                }
                                className="transition-all duration-200 hover:scale-110 hover:bg-purple-50"
                                title="Add questions from question bank"
                              >
                                <PlusCircle className="h-4 w-4 text-purple-600" />
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
                  <div className="space-y-2">
                    <Input
                      id="courseId"
                      placeholder="Enter course ID (e.g., guid or course ID from database)"
                      value={assessmentForm.courseId}
                      onChange={(e) =>
                        setAssessmentForm({
                          ...assessmentForm,
                          courseId: e.target.value
                        })
                      }
                    />
                    <p className="text-xs text-amber-600">
                      ⚠️ Make sure the course ID exists in the database. Invalid
                      course IDs will cause creation to fail.
                    </p>
                  </div>
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
                          courses
                            .filter(
                              (course) =>
                                course.id &&
                                typeof course.id === 'string' &&
                                course.id.trim() !== ''
                            )
                            .map((course) => (
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
                        available. You can use "Manual entry" to enter a course
                        ID directly.
                      </p>
                    )}
                    {!loadingCourses &&
                      !coursesError &&
                      courses.length === 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">
                            No courses available. Courses are managed through
                            syllabuses. Please create a syllabus and add courses
                            to it first.
                          </p>
                          <p className="text-xs font-medium text-amber-600">
                            💡 Tip: You can use "Manual entry" above to enter a
                            course ID directly if you know it.
                          </p>
                        </div>
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

              {/* Validation Summary */}
              {(!assessmentForm.title.trim() ||
                !assessmentForm.courseId ||
                !assessmentForm.creatorId ||
                assessmentForm.totalQuestions <= 0 ||
                assessmentForm.durationMinutes <= 0) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-2 text-sm font-medium text-amber-800">
                    Please complete the following required fields:
                  </p>
                  <ul className="ml-4 list-disc space-y-1 text-xs text-amber-700">
                    {!assessmentForm.title.trim() && (
                      <li>Enter an assessment title</li>
                    )}
                    {!assessmentForm.courseId && (
                      <li>Select a course (or use manual entry)</li>
                    )}
                    {!assessmentForm.creatorId && (
                      <li>User authentication required</li>
                    )}
                    {assessmentForm.totalQuestions <= 0 && (
                      <li>Set total questions (must be greater than 0)</li>
                    )}
                    {assessmentForm.durationMinutes <= 0 && (
                      <li>Set duration in minutes (must be greater than 0)</li>
                    )}
                  </ul>
                </div>
              )}
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
                  !assessmentForm.creatorId ||
                  assessmentForm.totalQuestions <= 0 ||
                  assessmentForm.durationMinutes <= 0
                }
                className="bg-gradient-to-r from-cyan-600 to-blue-600"
                title={
                  !assessmentForm.title.trim()
                    ? 'Please enter a title'
                    : !assessmentForm.courseId
                      ? 'Please select a course'
                      : !assessmentForm.creatorId
                        ? 'User not authenticated'
                        : assessmentForm.totalQuestions <= 0
                          ? 'Total questions must be greater than 0'
                          : assessmentForm.durationMinutes <= 0
                            ? 'Duration must be greater than 0'
                            : ''
                }
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
                  {assessmentForQuestions && !editingQuestion && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">
                        Question limit: {assessmentQuestions.length} /{' '}
                        {assessmentForQuestions.totalQuestions}
                      </span>
                      {assessmentQuestions.length + selectedQuestionIds.length >
                        assessmentForQuestions.totalQuestions && (
                        <span className="ml-2 font-medium text-red-600">
                          (Exceeds limit by{' '}
                          {assessmentQuestions.length +
                            selectedQuestionIds.length -
                            assessmentForQuestions.totalQuestions}
                          )
                        </span>
                      )}
                      {assessmentQuestions.length +
                        selectedQuestionIds.length <=
                        assessmentForQuestions.totalQuestions && (
                        <span className="ml-2 text-green-600">
                          (
                          {assessmentForQuestions.totalQuestions -
                            assessmentQuestions.length -
                            selectedQuestionIds.length}{' '}
                          remaining)
                        </span>
                      )}
                    </div>
                  )}
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
                          createAssessmentQuestionsMutation.isPending ||
                          (!!assessmentForQuestions &&
                            assessmentQuestions.length +
                              selectedQuestionIds.length >
                              assessmentForQuestions.totalQuestions)
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

        {/* Add Questions from Question Bank Dialog */}
        <Dialog
          open={addQuestionsDialogOpen}
          onOpenChange={(open) => {
            setAddQuestionsDialogOpen(open);
            if (!open) {
              setAssessmentForAddQuestions(null);
              setSelectedQuestionBankId('');
              setSelectedQuestionIdsFromBank([]);
            }
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Add Questions from Question Bank -{' '}
                {assessmentForAddQuestions?.title}
              </DialogTitle>
              <DialogDescription>
                Select a question bank and choose questions to add to this
                assessment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Step 1: Select Question Bank */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Step 1: Select Question Bank
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionBank">Question Bank *</Label>
                    <Select
                      value={selectedQuestionBankId}
                      onValueChange={(value) => {
                        setSelectedQuestionBankId(value);
                        setSelectedQuestionIdsFromBank([]); // Reset selected questions when bank changes
                      }}
                      disabled={loadingQuestionBanks}
                    >
                      <SelectTrigger id="questionBank">
                        <SelectValue
                          placeholder={
                            loadingQuestionBanks
                              ? 'Loading question banks...'
                              : questionBanks.length === 0
                                ? 'No question banks available'
                                : 'Select a question bank'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingQuestionBanks ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-sm">
                              Loading question banks...
                            </span>
                          </div>
                        ) : questionBanks.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            No question banks available
                          </div>
                        ) : (
                          questionBanks.map((bank) => (
                            <SelectItem
                              key={bank.questionBanksId}
                              value={bank.questionBanksId}
                            >
                              {bank.title}
                              {bank.subject && ` (${bank.subject})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Select Questions */}
              {selectedQuestionBankId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Step 2: Select Questions (
                      {selectedQuestionIdsFromBank.length} selected)
                    </CardTitle>
                    {assessmentForAddQuestions && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">
                          Question limit: {currentAssessmentQuestions.length} /{' '}
                          {assessmentForAddQuestions.totalQuestions}
                        </span>
                        {(() => {
                          const remaining =
                            assessmentForAddQuestions.totalQuestions -
                            currentAssessmentQuestions.length;
                          const willExceed =
                            selectedQuestionIdsFromBank.length > remaining;
                          if (willExceed) {
                            return (
                              <span className="ml-2 font-medium text-red-600">
                                (Exceeds limit by{' '}
                                {selectedQuestionIdsFromBank.length - remaining}
                                . You can only add {remaining} more question
                                {remaining !== 1 ? 's' : ''})
                              </span>
                            );
                          }
                          return (
                            <span className="ml-2 text-green-600">
                              ({remaining - selectedQuestionIdsFromBank.length}{' '}
                              remaining after adding{' '}
                              {selectedQuestionIdsFromBank.length})
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loadingQuestionsFromBank ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : questionsFromBank.length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        <BookOpen className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                        <p>No questions available in this question bank</p>
                      </div>
                    ) : (
                      <>
                        <div className="max-h-96 space-y-2 overflow-y-auto rounded-md border p-2">
                          {questionsFromBank.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-500">
                              <BookOpen className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                              <p>
                                No available questions to add. All questions
                                from this bank are already in the assessment or
                                not published.
                              </p>
                            </div>
                          ) : (
                            questionsFromBank.map((question) => (
                              <div
                                key={question.questionId}
                                className="flex items-start gap-2 rounded p-2 hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  id={`bank-question-${question.questionId}`}
                                  checked={selectedQuestionIdsFromBank.includes(
                                    question.questionId
                                  )}
                                  disabled={
                                    !selectedQuestionIdsFromBank.includes(
                                      question.questionId
                                    ) &&
                                    !!assessmentForAddQuestions &&
                                    currentAssessmentQuestions.length +
                                      selectedQuestionIdsFromBank.length >=
                                      assessmentForAddQuestions.totalQuestions
                                  }
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      // Check if adding this question would exceed the limit
                                      if (assessmentForAddQuestions) {
                                        const remaining =
                                          assessmentForAddQuestions.totalQuestions -
                                          currentAssessmentQuestions.length;
                                        if (
                                          selectedQuestionIdsFromBank.length >=
                                          remaining
                                        ) {
                                          toast.error(
                                            `Cannot select more questions. You can only add ${remaining} more question${remaining !== 1 ? 's' : ''} to this assessment.`
                                          );
                                          return;
                                        }
                                      }
                                      setSelectedQuestionIdsFromBank([
                                        ...selectedQuestionIdsFromBank,
                                        question.questionId
                                      ]);
                                    } else {
                                      setSelectedQuestionIdsFromBank(
                                        selectedQuestionIdsFromBank.filter(
                                          (id) => id !== question.questionId
                                        )
                                      );
                                    }
                                  }}
                                  className="mt-1 h-4 w-4 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <label
                                  htmlFor={`bank-question-${question.questionId}`}
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
                            ))
                          )}
                        </div>

                        {selectedQuestionIdsFromBank.length > 0 && (
                          <div className="space-y-2">
                            <Label>
                              Selected Questions (
                              {selectedQuestionIdsFromBank.length})
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {selectedQuestionIdsFromBank.map((id) => {
                                const question = questionsFromBank.find(
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
                                        setSelectedQuestionIdsFromBank(
                                          selectedQuestionIdsFromBank.filter(
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
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddQuestionsDialogOpen(false);
                  setAssessmentForAddQuestions(null);
                  setSelectedQuestionBankId('');
                  setSelectedQuestionIdsFromBank([]);
                }}
                disabled={createAssessmentQuestionsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddQuestionsFromBankSubmit}
                disabled={
                  !selectedQuestionBankId ||
                  selectedQuestionIdsFromBank.length === 0 ||
                  createAssessmentQuestionsMutation.isPending ||
                  (!!assessmentForAddQuestions &&
                    currentAssessmentQuestions.length +
                      selectedQuestionIdsFromBank.length >
                      assessmentForAddQuestions.totalQuestions)
                }
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {createAssessmentQuestionsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add{' '}
                {selectedQuestionIdsFromBank.length > 0
                  ? `${selectedQuestionIdsFromBank.length} `
                  : ''}
                Question{selectedQuestionIdsFromBank.length !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Questions Dialog */}
        <Dialog
          open={viewQuestionsDialogOpen}
          onOpenChange={(open) => {
            setViewQuestionsDialogOpen(open);
            if (!open) {
              setAssessmentForViewQuestions(null);
            }
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                View Questions - {assessmentForViewQuestions?.title}
              </DialogTitle>
              <DialogDescription>
                View all questions, options, and correct answers in this
                assessment
              </DialogDescription>
            </DialogHeader>

            <ViewQuestionsContent
              assessmentId={assessmentForViewQuestions?.assessmentId}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

// Component to display all questions with details
function ViewQuestionsContent({ assessmentId }: { assessmentId?: number }) {
  // Fetch assessment questions
  const {
    data: assessmentQuestionsData,
    isLoading: loadingAssessmentQuestions
  } = useQuery({
    queryKey: ['assessment-questions-view', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;
      const response = await getAssessmentQuestionsByAssessmentId(assessmentId);
      return response;
    },
    enabled: !!assessmentId
  });

  const assessmentQuestions = (assessmentQuestionsData?.data ||
    assessmentQuestionsData?.Data ||
    []) as AssessmentQuestionDto[];

  if (loadingAssessmentQuestions) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (!assessmentQuestions || assessmentQuestions.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <BookOpen className="mx-auto mb-2 h-12 w-12 text-gray-300" />
        <p>No questions added to this assessment yet.</p>
      </div>
    );
  }

  // Sort by order number
  const sortedQuestions = [...assessmentQuestions].sort(
    (a, b) => a.orderNum - b.orderNum
  );

  return (
    <div className="space-y-6 py-4">
      {sortedQuestions.map((assessmentQuestion) => (
        <QuestionDetailCard
          key={assessmentQuestion.assessmentQuestionId}
          assessmentQuestion={assessmentQuestion}
        />
      ))}
    </div>
  );
}

// Component to display individual question with details
function QuestionDetailCard({
  assessmentQuestion
}: {
  assessmentQuestion: AssessmentQuestionDto;
}) {
  const [question, setQuestion] = useState<QuestionDto | null>(null);
  const [options, setOptions] = useState<QuestionOptionDto[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchQuestionData = async () => {
      if (!assessmentQuestion.questionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch question details
        const questionResponse = await getQuestionById(
          assessmentQuestion.questionId
        );
        const questionData = questionResponse.data as QuestionDto;
        setQuestion(questionData);

        // Fetch question options
        const optionsResponse = await getQuestionOptionsByQuestionId(
          assessmentQuestion.questionId
        );
        const optionsData = (optionsResponse.data || []) as QuestionOptionDto[];
        setOptions(optionsData);
      } catch (error) {
        console.error('Error fetching question:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionData();
  }, [assessmentQuestion.questionId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!question) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">
            Question not found (ID: {assessmentQuestion.questionId})
          </p>
        </CardContent>
      </Card>
    );
  }

  // For multiple choice questions, find all correct options based on IsCorrect property
  const sortedOptions = options.sort((a, b) => a.orderIdx - b.orderIdx);
  const correctOptions = sortedOptions.filter((opt) => opt.isCorrect);
  const correctAnswerLetters = sortedOptions
    .map((opt, idx) => ({ opt, letter: String.fromCharCode(65 + idx) }))
    .filter(({ opt }) => opt.isCorrect)
    .map(({ letter }) => letter);

  return (
    <Card className="border-cyan-200">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Question Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  Question {assessmentQuestion.orderNum}
                </Badge>
                {question.questionType === 1 && (
                  <Badge variant="secondary">📝 Paragraph</Badge>
                )}
                {question.questionType === 2 && (
                  <Badge variant="default">☑️ Multiple Choice</Badge>
                )}
                {question.questionType === 2 &&
                  correctAnswerLetters.length > 0 && (
                    <Badge className="bg-green-600">
                      Correct Answer{correctAnswerLetters.length > 1 ? 's' : ''}
                      : {correctAnswerLetters.join(', ')}
                    </Badge>
                  )}
                {question.questionType === 1 &&
                  assessmentQuestion.correctAnswer && (
                    <Badge className="bg-green-600">
                      Reference Answer Available
                    </Badge>
                  )}
              </div>
            </div>
          </div>

          {/* Question Title and Body */}
          <div>
            <h4 className="mb-2 text-lg font-semibold">{question.title}</h4>
            <div
              className="prose max-w-none text-sm text-gray-700"
              dangerouslySetInnerHTML={{ __html: question.body }}
            />
          </div>

          {/* Multiple Choice Options */}
          {question.questionType === 2 && sortedOptions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Options:</p>
              <div className="space-y-2">
                {sortedOptions.map((option, idx) => {
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D
                  const isCorrect = option.isCorrect;

                  return (
                    <div
                      key={option.questionOptionId}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${
                        isCorrect
                          ? 'border-green-300 bg-green-100'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                          isCorrect
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {letter}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{option.optionText}</p>
                      </div>
                      {isCorrect && (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Correct Answer
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              {correctOptions.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  ⚠️ No correct answers marked in the question options.
                </p>
              )}
            </div>
          )}

          {/* Paragraph Answer Display */}
          {question.questionType === 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Expected Answer:
              </p>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {assessmentQuestion.correctAnswer ||
                    'No reference answer provided'}
                </p>
              </div>
            </div>
          )}

          {/* Question Metadata */}
          {(question.tags || question.metadata) && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="space-y-1 text-xs text-gray-600">
                {question.tags && (
                  <div>
                    <span className="font-medium">Tags: </span>
                    {question.tags}
                  </div>
                )}
                {question.metadata && (
                  <div>
                    <span className="font-medium">Metadata: </span>
                    {question.metadata}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
