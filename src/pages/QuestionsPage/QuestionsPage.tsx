import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  BookOpen,
  Edit,
  Trash2,
  Eye,
  Loader2,
  FolderOpen,
  Filter
} from 'lucide-react';
import {
  QuestionType,
  QuestionDto,
  QuestionBankDto
} from '@/queries/question.query';
import {
  deleteQuestion,
  getQuestionsByQuestionBankId
} from '@/services/question.api';
import {
  getMyQuestionBanks,
  createQuestionBank,
  updateQuestionBank,
  deleteQuestionBank,
  CreateQuestionBankRequest
} from '@/services/question-bank.api';
import { Skeleton } from '@/components/ui/skeleton';

export default function QuestionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Question Bank state
  const [selectedQuestionBankId, setSelectedQuestionBankId] =
    useState<string>('');
  const [questionBankDialogOpen, setQuestionBankDialogOpen] = useState(false);
  const [questionBankDeleteDialogOpen, setQuestionBankDeleteDialogOpen] =
    useState(false);
  const [editingQuestionBank, setEditingQuestionBank] =
    useState<QuestionBankDto | null>(null);
  const [questionBankToDelete, setQuestionBankToDelete] =
    useState<QuestionBankDto | null>(null);
  const [questionBankForm, setQuestionBankForm] =
    useState<CreateQuestionBankRequest>({
      title: '',
      description: '',
      subject: ''
    });

  // Question state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<QuestionDto | null>(
    null
  );

  // Fetch question banks
  const {
    data: questionBanksData,
    isLoading: loadingQuestionBanks,
    isError: questionBanksError
  } = useQuery({
    queryKey: ['question-banks'],
    queryFn: async () => {
      const response = await getMyQuestionBanks();
      return response;
    }
  });

  const questionBanks = (questionBanksData?.data || []) as QuestionBankDto[];

  // Set first question bank as selected when loaded
  useEffect(() => {
    if (questionBanks.length > 0 && !selectedQuestionBankId) {
      setSelectedQuestionBankId(questionBanks[0].questionBanksId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionBanks.length, selectedQuestionBankId]);

  // Fetch questions by selected question bank
  const {
    data: questionsData,
    isLoading: loadingQuestions,
    isError: questionsError,
    error: questionsErrorData
  } = useQuery({
    queryKey: ['questions', selectedQuestionBankId],
    queryFn: async () => {
      if (!selectedQuestionBankId) {
        return { data: [] };
      }
      const response = await getQuestionsByQuestionBankId(
        selectedQuestionBankId
      );
      return response;
    },
    enabled: !!selectedQuestionBankId
  });

  const questions = (questionsData?.data || []) as QuestionDto[];

  // Question Bank mutations
  const createQuestionBankMutation = useMutation({
    mutationFn: async (data: CreateQuestionBankRequest) => {
      return await createQuestionBank(data);
    },
    onSuccess: () => {
      toast.success('Question bank created successfully');
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      setQuestionBankDialogOpen(false);
      resetQuestionBankForm();
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to create question bank';
      toast.error(errorMessage);
    }
  });

  const updateQuestionBankMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: CreateQuestionBankRequest;
    }) => {
      return await updateQuestionBank(id, data);
    },
    onSuccess: () => {
      toast.success('Question bank updated successfully');
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      queryClient.invalidateQueries({
        queryKey: ['questions', selectedQuestionBankId]
      });
      setQuestionBankDialogOpen(false);
      setEditingQuestionBank(null);
      resetQuestionBankForm();
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to update question bank';
      toast.error(errorMessage);
    }
  });

  const deleteQuestionBankMutation = useMutation({
    mutationFn: async (questionBankId: string) => {
      return await deleteQuestionBank(questionBankId);
    },
    onSuccess: () => {
      toast.success('Question bank deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      if (questionBankToDelete?.questionBanksId === selectedQuestionBankId) {
        setSelectedQuestionBankId('');
      }
      setQuestionBankDeleteDialogOpen(false);
      setQuestionBankToDelete(null);
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to delete question bank';
      toast.error(errorMessage);
    }
  });

  // Question mutations
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      return await deleteQuestion(questionId);
    },
    onSuccess: () => {
      toast.success('Question deleted successfully');
      queryClient.invalidateQueries({
        queryKey: ['questions', selectedQuestionBankId]
      });
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to delete question';
      toast.error(errorMessage);
    }
  });

  // Question Bank handlers
  const handleCreateQuestionBank = () => {
    setEditingQuestionBank(null);
    resetQuestionBankForm();
    setQuestionBankDialogOpen(true);
  };

  const handleEditQuestionBank = (questionBank: QuestionBankDto) => {
    setEditingQuestionBank(questionBank);
    setQuestionBankForm({
      title: questionBank.title,
      description: questionBank.description || '',
      subject: questionBank.subject || ''
    });
    setQuestionBankDialogOpen(true);
  };

  const handleDeleteQuestionBank = (questionBank: QuestionBankDto) => {
    setQuestionBankToDelete(questionBank);
    setQuestionBankDeleteDialogOpen(true);
  };

  const handleSaveQuestionBank = () => {
    if (!questionBankForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (editingQuestionBank) {
      updateQuestionBankMutation.mutate({
        id: editingQuestionBank.questionBanksId,
        data: questionBankForm
      });
    } else {
      createQuestionBankMutation.mutate(questionBankForm);
    }
  };

  const handleDeleteQuestionBankConfirm = () => {
    if (questionBankToDelete) {
      deleteQuestionBankMutation.mutate(questionBankToDelete.questionBanksId);
    }
  };

  const resetQuestionBankForm = () => {
    setQuestionBankForm({
      title: '',
      description: '',
      subject: ''
    });
  };

  // Question handlers
  const handleDeleteClick = (question: QuestionDto) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (questionToDelete) {
      deleteQuestionMutation.mutate(questionToDelete.questionId);
    }
  };

  const handleViewClick = (question: QuestionDto) => {
    navigate(`/questions/${question.questionId}`);
  };

  const handleEditClick = (question: QuestionDto) => {
    navigate(`/questions/edit/${question.questionId}`);
  };

  const handleCreateQuestion = () => {
    if (!selectedQuestionBankId) {
      toast.error('Please select a question bank first');
      return;
    }
    navigate(`/questions/create?questionBankId=${selectedQuestionBankId}`);
  };

  const getQuestionTypeBadge = (type: number) => {
    return type === QuestionType.Paragraph ? (
      <Badge variant="secondary">📝 Paragraph</Badge>
    ) : (
      <Badge variant="default">☑️ Multiple Choice</Badge>
    );
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
                <BookOpen className="h-10 w-10 transition-transform hover:scale-110" />
                Questions Bank
              </h1>
              <p
                className="text-lg text-gray-600"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                Manage your question banks and questions
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateQuestionBank}
                variant="outline"
                className="gap-2"
              >
                <FolderOpen className="h-5 w-5" />
                New Question Bank
              </Button>
              <Button
                onClick={handleCreateQuestion}
                disabled={!selectedQuestionBankId}
                className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg transition-all duration-300 hover:scale-105 hover:from-cyan-700 hover:to-blue-700 hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Create Question
              </Button>
            </div>
          </div>

          {/* Question Bank Management Section */}
          <Card
            className="animate-slide-in mb-6 shadow-lg transition-all duration-300 hover:shadow-2xl"
            style={{ animationDelay: '0.1s', opacity: 0 }}
          >
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Question Banks
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {questionBanks.length}{' '}
                  {questionBanks.length === 1 ? 'Bank' : 'Banks'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loadingQuestionBanks ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : questionBanksError ? (
                <div className="py-4 text-center text-red-600">
                  Error loading question banks. Please try again.
                </div>
              ) : questionBanks.length === 0 ? (
                <div className="py-4 text-center text-gray-500">
                  No question banks yet. Create your first question bank to get
                  started.
                </div>
              ) : (
                <div className="space-y-2">
                  <Label
                    htmlFor="questionBankSelect"
                    className="text-sm font-medium"
                  >
                    Select Question Bank
                  </Label>
                  <Select
                    value={selectedQuestionBankId}
                    onValueChange={setSelectedQuestionBankId}
                  >
                    <SelectTrigger id="questionBankSelect" className="w-full">
                      <SelectValue placeholder="Select a question bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {questionBanks.map((bank) => (
                        <SelectItem
                          key={bank.questionBanksId}
                          value={bank.questionBanksId}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span>{bank.title}</span>
                            {bank.subject && (
                              <Badge variant="outline" className="ml-2">
                                {bank.subject}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {questionBanks.map((bank) => (
                      <Card
                        key={bank.questionBanksId}
                        className={`cursor-pointer p-3 transition-all ${
                          selectedQuestionBankId === bank.questionBanksId
                            ? 'bg-cyan-50 ring-2 ring-cyan-600'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() =>
                          setSelectedQuestionBankId(bank.questionBanksId)
                        }
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="text-sm font-semibold">
                              {bank.title}
                            </div>
                            {bank.description && (
                              <div className="mt-1 line-clamp-1 text-xs text-gray-500">
                                {bank.description}
                              </div>
                            )}
                            <div className="mt-2 flex gap-2">
                              {bank.subject && (
                                <Badge variant="outline" className="text-xs">
                                  {bank.subject}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditQuestionBank(bank);
                              }}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuestionBank(bank);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questions Table */}
          {selectedQuestionBankId && (
            <Card
              className="animate-slide-in shadow-lg transition-all duration-300 hover:shadow-2xl"
              style={{ animationDelay: '0.2s', opacity: 0 }}
            >
              <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 transition-transform hover:scale-110" />
                    Questions
                    {questionBanks.find(
                      (b) => b.questionBanksId === selectedQuestionBankId
                    ) && (
                      <span className="ml-2 text-sm font-normal">
                        (
                        {
                          questionBanks.find(
                            (b) => b.questionBanksId === selectedQuestionBankId
                          )?.title
                        }
                        )
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {questions.length}{' '}
                    {questions.length === 1 ? 'Question' : 'Questions'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingQuestions ? (
                  <div className="space-y-4 p-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ))}
                  </div>
                ) : questionsError ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <BookOpen className="mb-4 h-16 w-16 text-red-300" />
                    <h3 className="mb-2 text-xl font-semibold text-red-700">
                      Error loading questions
                    </h3>
                    <p className="mb-4 text-gray-500">
                      {questionsErrorData instanceof Error
                        ? questionsErrorData.message
                        : 'An error occurred while loading questions'}
                    </p>
                    <Button
                      onClick={() =>
                        queryClient.invalidateQueries({
                          queryKey: ['questions', selectedQuestionBankId]
                        })
                      }
                      variant="outline"
                      className="gap-2"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <BookOpen className="mb-4 h-16 w-16 text-gray-300" />
                    <h3 className="mb-2 text-xl font-semibold text-gray-700">
                      No questions yet
                    </h3>
                    <p className="mb-4 text-gray-500">
                      Get started by creating your first question in this
                      question bank
                    </p>
                    <Button onClick={handleCreateQuestion} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create First Question
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50%]">Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((question: QuestionDto) => (
                        <TableRow
                          key={question.questionId}
                          className="transition-colors duration-200 hover:bg-cyan-50"
                        >
                          <TableCell className="font-medium">
                            <div>
                              <div className="text-sm font-semibold">
                                {question.title}
                              </div>
                              {question.tags && (
                                <div className="mt-1 text-xs text-gray-500">
                                  Tags: {question.tags}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getQuestionTypeBadge(question.questionType)}
                          </TableCell>
                          <TableCell>
                            {question.isPublished ? (
                              <Badge
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Published
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(question.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewClick(question)}
                                className="transition-all duration-200 hover:scale-110 hover:bg-blue-50"
                                title="View question"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(question)}
                                className="transition-all duration-200 hover:scale-110 hover:bg-green-50"
                                title="Edit question"
                              >
                                <Edit className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(question)}
                                disabled={deleteQuestionMutation.isPending}
                                className="transition-all duration-200 hover:scale-110 hover:bg-red-50"
                                title="Delete question"
                              >
                                {deleteQuestionMutation.isPending &&
                                questionToDelete?.questionId ===
                                  question.questionId ? (
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
          )}

          {/* Stats Cards */}
          {!loadingQuestions &&
            questions.length > 0 &&
            selectedQuestionBankId && (
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card
                  className="animate-scale-in border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ animationDelay: '0.3s', opacity: 0 }}
                >
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-cyan-700">
                      Total Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-cyan-600">
                      {questions.length}
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className="animate-scale-in border-green-200 bg-gradient-to-br from-green-50 to-green-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ animationDelay: '0.4s', opacity: 0 }}
                >
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-green-700">
                      Published
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {
                        questions.filter((q: QuestionDto) => q.isPublished)
                          .length
                      }
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className="animate-scale-in border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ animationDelay: '0.5s', opacity: 0 }}
                >
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-orange-700">
                      Drafts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {
                        questions.filter((q: QuestionDto) => !q.isPublished)
                          .length
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          {!selectedQuestionBankId && questionBanks.length > 0 && (
            <Card className="mt-6 border-yellow-200 bg-yellow-50">
              <CardContent className="p-6 text-center">
                <Filter className="mx-auto mb-4 h-12 w-12 text-yellow-600" />
                <h3 className="mb-2 text-lg font-semibold text-yellow-800">
                  Select a Question Bank
                </h3>
                <p className="text-yellow-700">
                  Please select a question bank from above to view and manage
                  questions.
                </p>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Question Bank Create/Edit Dialog */}
        <Dialog
          open={questionBankDialogOpen}
          onOpenChange={setQuestionBankDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingQuestionBank
                  ? 'Edit Question Bank'
                  : 'Create Question Bank'}
              </DialogTitle>
              <DialogDescription>
                {editingQuestionBank
                  ? 'Update the question bank information.'
                  : 'Create a new question bank to organize your questions.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter question bank title"
                  value={questionBankForm.title}
                  onChange={(e) =>
                    setQuestionBankForm({
                      ...questionBankForm,
                      title: e.target.value
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter subject (e.g., Mathematics, Science)"
                  value={questionBankForm.subject}
                  onChange={(e) =>
                    setQuestionBankForm({
                      ...questionBankForm,
                      subject: e.target.value
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter question bank description"
                  value={questionBankForm.description}
                  onChange={(e) =>
                    setQuestionBankForm({
                      ...questionBankForm,
                      description: e.target.value
                    })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setQuestionBankDialogOpen(false);
                  setEditingQuestionBank(null);
                  resetQuestionBankForm();
                }}
                disabled={
                  createQuestionBankMutation.isPending ||
                  updateQuestionBankMutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveQuestionBank}
                disabled={
                  createQuestionBankMutation.isPending ||
                  updateQuestionBankMutation.isPending ||
                  !questionBankForm.title.trim()
                }
                className="bg-gradient-to-r from-cyan-600 to-blue-600"
              >
                {(createQuestionBankMutation.isPending ||
                  updateQuestionBankMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingQuestionBank ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Question Bank Delete Confirmation Dialog */}
        <AlertDialog
          open={questionBankDeleteDialogOpen}
          onOpenChange={setQuestionBankDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Question Bank</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the question bank "
                {questionBankToDelete?.title}"? This action cannot be undone and
                will permanently delete the question bank and all its associated
                questions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deleteQuestionBankMutation.isPending}
                onClick={() => {
                  setQuestionBankDeleteDialogOpen(false);
                  setQuestionBankToDelete(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteQuestionBankConfirm}
                disabled={deleteQuestionBankMutation.isPending}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleteQuestionBankMutation.isPending ? (
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

        {/* Question Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Question</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the question "
                {questionToDelete?.title}"? This action cannot be undone and
                will permanently delete the question and all its associated
                options.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deleteQuestionMutation.isPending}
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setQuestionToDelete(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteQuestionMutation.isPending}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleteQuestionMutation.isPending ? (
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
