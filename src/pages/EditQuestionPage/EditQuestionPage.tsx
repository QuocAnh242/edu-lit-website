import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle,
  Loader2
} from 'lucide-react';
import {
  getQuestionById,
  getQuestionOptionsByQuestionId,
  updateQuestion,
  updateQuestionOption,
  deleteQuestionOption,
  createQuestionOption,
  deleteQuestionOptionsByQuestionId,
  QuestionOptionDto,
  UpdateQuestionRequest
} from '@/services/question.api';
import { getMyQuestionBanks } from '@/services/question-bank.api';
import {
  QuestionDto,
  QuestionType,
  QuestionBankDto
} from '@/queries/question.query';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/shared/navbar';
import __helpers from '@/helpers';

interface QuestionOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  orderIdx: number;
  questionOptionId?: string; // For existing options
  isNew?: boolean; // Flag for new options
  isDeleted?: boolean; // Flag for deleted options
}

export default function EditQuestionPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [questionType, setQuestionType] = useState<QuestionType>(
    QuestionType.Multichoice
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [metadata, setMetadata] = useState('');
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [selectedQuestionBankId, setSelectedQuestionBankId] = useState('');
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [sampleAnswer, setSampleAnswer] = useState('');
  const [version, setVersion] = useState(1);

  // Fetch question
  const {
    data: questionData,
    isLoading: loadingQuestion,
    isError: questionError,
    error: questionErrorData
  } = useQuery({
    queryKey: ['question', questionId],
    queryFn: async () => {
      if (!questionId) throw new Error('Question ID is required');
      return await getQuestionById(questionId);
    },
    enabled: !!questionId
  });

  // Fetch question options
  const { data: optionsData, isLoading: loadingOptions } = useQuery({
    queryKey: ['question-options', questionId],
    queryFn: async () => {
      if (!questionId) throw new Error('Question ID is required');
      return await getQuestionOptionsByQuestionId(questionId);
    },
    enabled: !!questionId
  });

  // Fetch question banks
  const { data: questionBanksData, isLoading: loadingBanks } = useQuery({
    queryKey: ['question-banks'],
    queryFn: async () => {
      return await getMyQuestionBanks();
    }
  });

  const question = questionData?.data as QuestionDto | undefined;
  const existingOptions = (optionsData?.data || []) as QuestionOptionDto[];
  const questionBanks = (questionBanksData?.data || []) as QuestionBankDto[];

  // Load question data when fetched
  useEffect(() => {
    if (question) {
      setTitle(question.title);
      setBody(question.body);
      setQuestionType(question.questionType);
      setMetadata(question.metadata || '');
      setTags(question.tags || '');
      setIsPublished(question.isPublished);
      setSelectedQuestionBankId(question.questionBankId);
      setVersion(question.version);

      // Parse metadata for sample answer
      if (question.metadata) {
        try {
          const metadataObj = JSON.parse(question.metadata);
          if (metadataObj.sampleAnswer) {
            setSampleAnswer(metadataObj.sampleAnswer);
          }
        } catch (e) {
          // Metadata is not JSON or doesn't contain sampleAnswer
        }
      }
    }
  }, [question]);

  // Load options when fetched
  useEffect(() => {
    if (existingOptions.length > 0) {
      const loadedOptions: QuestionOption[] = existingOptions.map((opt) => ({
        id: opt.questionOptionId,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        orderIdx: opt.orderIdx,
        questionOptionId: opt.questionOptionId
      }));
      setOptions(loadedOptions);
    }
  }, [existingOptions]);

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async (data: UpdateQuestionRequest) => {
      if (!questionId) throw new Error('Question ID is required');
      return await updateQuestion(questionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question', questionId] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    }
  });

  // Update option mutation
  const updateOptionMutation = useMutation({
    mutationFn: async ({
      questionOptionId,
      data
    }: {
      questionOptionId: string;
      data: { optionText: string; isCorrect: boolean; orderIdx: number };
    }) => {
      return await updateQuestionOption(questionOptionId, {
        questionOptionId,
        ...data
      });
    }
  });

  // Create option mutation
  const createOptionMutation = useMutation({
    mutationFn: async (data: {
      optionText: string;
      isCorrect: boolean;
      orderIdx: number;
      questionId: string;
    }) => {
      return await createQuestionOption(data);
    }
  });

  // Delete option mutation
  const deleteOptionMutation = useMutation({
    mutationFn: async (questionOptionId: string) => {
      return await deleteQuestionOption(questionOptionId);
    }
  });

  // Add new option
  const addOption = () => {
    if (options.filter((opt) => !opt.isDeleted).length >= 10) {
      toast.error('Maximum 10 options allowed', {
        description: 'You cannot add more than 10 answer options per question'
      });
      return;
    }

    const newOption: QuestionOption = {
      id: `temp-${Date.now()}`,
      optionText: '',
      isCorrect: false,
      orderIdx: options.filter((opt) => !opt.isDeleted).length,
      isNew: true
    };
    setOptions([...options, newOption]);
  };

  // Remove option (mark as deleted if existing, otherwise remove from array)
  const removeOption = (id: string) => {
    const option = options.find((opt) => opt.id === id);
    if (option?.isNew) {
      // Remove new option from array
      setOptions(options.filter((opt) => opt.id !== id));
    } else if (option?.questionOptionId) {
      // Mark existing option as deleted
      setOptions(
        options.map((opt) =>
          opt.id === id ? { ...opt, isDeleted: true } : opt
        )
      );
    }
  };

  // Update option text
  const updateOptionText = (id: string, text: string) => {
    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, optionText: text } : opt))
    );
  };

  // Toggle correct answer
  const toggleCorrect = (id: string) => {
    setOptions(
      options.map((opt) =>
        opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt
      )
    );
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('Please enter a question title');
      return false;
    }
    if (!body.trim()) {
      toast.error('Please enter question body/content');
      return false;
    }
    if (!selectedQuestionBankId) {
      toast.error('Please select a question bank');
      return false;
    }
    if (questionType === QuestionType.Multichoice) {
      const activeOptions = options.filter((opt) => !opt.isDeleted);
      if (activeOptions.length < 2) {
        toast.error('Multiple choice questions need at least 2 options');
        return false;
      }
      if (activeOptions.some((opt) => !opt.optionText.trim())) {
        toast.error('All options must have text');
        return false;
      }
      if (!activeOptions.some((opt) => opt.isCorrect)) {
        toast.error('Please mark at least one correct answer');
        return false;
      }
    }
    return true;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!questionId || !question) {
      toast.error('Question data is missing');
      return;
    }

    try {
      const authorId = __helpers.getUserId();
      if (!authorId) {
        toast.error('User not authenticated. Please login.');
        return;
      }

      // Prepare metadata
      let metadataJson = metadata.trim();
      if (questionType === QuestionType.Paragraph && sampleAnswer.trim()) {
        const metadataObj = {
          sampleAnswer: sampleAnswer.trim(),
          ...(metadata.trim() ? JSON.parse(metadata.trim()) : {})
        };
        metadataJson = JSON.stringify(metadataObj);
      }

      // Update question
      const questionData: UpdateQuestionRequest = {
        questionId: questionId,
        title: title.trim(),
        body: body.trim(),
        questionType: questionType,
        metadata: metadataJson || undefined,
        tags: tags.trim() || undefined,
        version: version + 1, // Increment version
        isPublished: isPublished,
        questionBankId: selectedQuestionBankId,
        authorId: authorId
      };

      const questionResponse =
        await updateQuestionMutation.mutateAsync(questionData);

      if (!questionResponse?.success) {
        toast.error('Failed to update question');
        return;
      }

      // Handle options for Multiple Choice questions
      if (questionType === QuestionType.Multichoice) {
        const activeOptions = options.filter((opt) => !opt.isDeleted);

        // Delete options that were marked as deleted
        const optionsToDelete = options.filter(
          (opt) => opt.isDeleted && opt.questionOptionId
        );
        for (const opt of optionsToDelete) {
          if (opt.questionOptionId) {
            await deleteOptionMutation.mutateAsync(opt.questionOptionId);
          }
        }

        // Update or create options
        for (let index = 0; index < activeOptions.length; index++) {
          const opt = activeOptions[index];
          const optionData = {
            optionText: opt.optionText.trim(),
            isCorrect: opt.isCorrect,
            orderIdx: index
          };

          if (opt.isNew) {
            // Create new option
            await createOptionMutation.mutateAsync({
              ...optionData,
              questionId: questionId
            });
          } else if (opt.questionOptionId) {
            // Update existing option
            await updateOptionMutation.mutateAsync({
              questionOptionId: opt.questionOptionId,
              data: optionData
            });
          }
        }
      } else {
        // For Paragraph type, delete all options if they exist
        if (existingOptions.length > 0) {
          await deleteQuestionOptionsByQuestionId(questionId);
        }
      }

      toast.success('Question updated successfully!', {
        description: `Question "${title}" has been updated.`
      });

      // Navigate back to questions list
      setTimeout(() => {
        navigate('/questions');
      }, 1500);
    } catch (error) {
      console.error('Error updating question:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      toast.error('Failed to update question', {
        description: errorMessage
      });
    }
  };

  if (loadingQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <div className="mx-auto max-w-4xl p-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (questionError || !question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <div className="mx-auto max-w-4xl p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <h2 className="mb-2 text-xl font-semibold text-red-700">
                Error Loading Question
              </h2>
              <p className="mb-4 text-red-600">
                {questionErrorData instanceof Error
                  ? questionErrorData.message
                  : 'Failed to load question. Please try again.'}
              </p>
              <Button onClick={() => navigate('/questions')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Questions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const activeOptions = options.filter((opt) => !opt.isDeleted);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <Navbar />
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Edit Question
              </h1>
              <p className="text-sm text-slate-600">
                Update question information and options
              </p>
            </div>
          </div>
          <Badge variant={isPublished ? 'default' : 'secondary'}>
            {isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Question Card */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
              <CardTitle>Question Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Question Type */}
              <div className="space-y-2">
                <Label htmlFor="questionType">Question Type *</Label>
                <Select
                  value={questionType.toString()}
                  onValueChange={(value) =>
                    setQuestionType(parseInt(value) as QuestionType)
                  }
                  disabled={updateQuestionMutation.isPending}
                >
                  <SelectTrigger id="questionType">
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={QuestionType.Paragraph.toString()}>
                      Paragraph (Essay)
                    </SelectItem>
                    <SelectItem value={QuestionType.Multichoice.toString()}>
                      Multiple Choice
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question Bank */}
              <div className="space-y-2">
                <Label htmlFor="questionBank">Question Bank *</Label>
                <Select
                  value={selectedQuestionBankId}
                  onValueChange={setSelectedQuestionBankId}
                  disabled={loadingBanks || updateQuestionMutation.isPending}
                >
                  <SelectTrigger id="questionBank">
                    <SelectValue
                      placeholder={
                        loadingBanks
                          ? 'Loading question banks...'
                          : 'Select a question bank'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(questionBanks) &&
                      questionBanks.map((bank) => (
                        <SelectItem
                          key={bank.questionBanksId}
                          value={bank.questionBanksId}
                        >
                          {bank.title}
                          {bank.subject && ` - ${bank.subject}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Question Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a clear and concise question title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-slate-300"
                  disabled={updateQuestionMutation.isPending}
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="body">Question Content *</Label>
                <Textarea
                  id="body"
                  placeholder="Enter the full question content or description"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  className="border-slate-300"
                  disabled={updateQuestionMutation.isPending}
                />
              </div>

              {/* Sample Answer for Paragraph Type */}
              {questionType === QuestionType.Paragraph && (
                <div className="space-y-2">
                  <Label htmlFor="sampleAnswer">
                    Sample Answer (Optional)
                    <span className="ml-2 text-xs text-slate-500">
                      - For grading reference
                    </span>
                  </Label>
                  <Textarea
                    id="sampleAnswer"
                    placeholder="Enter a sample answer for this essay question (optional)..."
                    value={sampleAnswer}
                    onChange={(e) => setSampleAnswer(e.target.value)}
                    rows={6}
                    className="border-slate-300"
                    disabled={updateQuestionMutation.isPending}
                  />
                  <p className="text-xs text-slate-500">
                    💡 This sample answer will help you grade student responses
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-2">
                <Label htmlFor="metadata">Metadata (Optional)</Label>
                <Input
                  id="metadata"
                  placeholder="Additional metadata (JSON format)"
                  value={metadata}
                  onChange={(e) => setMetadata(e.target.value)}
                  className="border-slate-300"
                  disabled={updateQuestionMutation.isPending}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas (e.g., math, algebra, beginner)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="border-slate-300"
                  disabled={updateQuestionMutation.isPending}
                />
              </div>

              {/* Published Switch */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="published" className="text-base">
                    Publish Question
                  </Label>
                  <div className="text-sm text-slate-500">
                    Make this question visible to students
                  </div>
                </div>
                <Switch
                  id="published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                  disabled={updateQuestionMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Options Card (Only for Multiple Choice) */}
          {questionType === QuestionType.Multichoice && (
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Answer Options</CardTitle>
                    <p className="mt-1 text-sm text-white/80">
                      {activeOptions.length}/10 options added
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addOption}
                    disabled={
                      activeOptions.length >= 10 ||
                      updateQuestionMutation.isPending
                    }
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {activeOptions.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
                    <p className="text-slate-500">
                      No options added yet. Click "Add Option" to create answer
                      choices. (Maximum 10 options)
                    </p>
                  </div>
                ) : (
                  <>
                    {activeOptions.length >= 10 && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                        ⚠️ Maximum limit reached. You have added 10 options
                        (maximum allowed).
                      </div>
                    )}
                    {activeOptions.map((option, index) => (
                      <div
                        key={option.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition-all hover:border-slate-300 hover:shadow-md"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-700">
                          {index + 1}
                        </div>
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option.optionText}
                          onChange={(e) =>
                            updateOptionText(option.id, e.target.value)
                          }
                          className="flex-1"
                          disabled={updateQuestionMutation.isPending}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={option.isCorrect ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleCorrect(option.id)}
                            disabled={updateQuestionMutation.isPending}
                            className={
                              option.isCorrect
                                ? 'bg-green-600 hover:bg-green-700'
                                : ''
                            }
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            {option.isCorrect ? 'Correct' : 'Mark Correct'}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeOption(option.id)}
                            disabled={updateQuestionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={updateQuestionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              disabled={
                updateQuestionMutation.isPending ||
                updateOptionMutation.isPending ||
                createOptionMutation.isPending ||
                deleteOptionMutation.isPending
              }
            >
              {updateQuestionMutation.isPending ||
              updateOptionMutation.isPending ||
              createOptionMutation.isPending ||
              deleteOptionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Question
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
