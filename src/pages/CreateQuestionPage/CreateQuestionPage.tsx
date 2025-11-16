import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle
} from 'lucide-react';
import {
  useCreateQuestion,
  useCreateQuestionOption,
  useGetQuestionBanks,
  QuestionType
} from '@/queries/question.query';
import __helpers from '@/helpers';
import './CreateQuestionPage.css';

interface QuestionOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  orderIdx: number;
}

export default function CreateQuestionPage() {
  const navigate = useNavigate();
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
  const [sampleAnswer, setSampleAnswer] = useState(''); // For Paragraph type

  // Error state for field validation
  const [errors, setErrors] = useState<{
    title?: string;
    body?: string;
    questionBank?: string;
    options?: string;
    optionText?: { [key: string]: string };
    correctAnswer?: string;
  }>({});

  // Get question banks
  const { data: questionBanksData, isLoading: loadingBanks } =
    useGetQuestionBanks();
  const questionBanks = questionBanksData?.data || [];

  // Mutations
  const createQuestionMutation = useCreateQuestion();
  const createOptionMutation = useCreateQuestionOption();

  // Add new option (max 10 for Multiple Choice only)
  const addOption = () => {
    if (options.length >= 10) {
      toast.error('Maximum 10 options allowed', {
        description: 'You cannot add more than 10 answer options per question'
      });
      return;
    }

    const newOption: QuestionOption = {
      id: `temp-${Date.now()}`,
      optionText: '',
      isCorrect: false,
      orderIdx: options.length
    };
    setOptions([...options, newOption]);
  };

  // Remove option
  const removeOption = (id: string) => {
    setOptions(options.filter((opt) => opt.id !== id));
  };

  // Update option text
  const updateOptionText = (id: string, text: string) => {
    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, optionText: text } : opt))
    );
    // Clear option text error when user starts typing
    if (errors.optionText?.[id]) {
      setErrors((prev) => {
        const newOptionText = { ...prev.optionText };
        delete newOptionText[id];
        return { ...prev, optionText: newOptionText };
      });
    }
    // Clear correct answer error if at least one option is correct
    if (errors.correctAnswer) {
      const updatedOptions = options.map((opt) =>
        opt.id === id ? { ...opt, optionText: text } : opt
      );
      if (updatedOptions.some((opt) => opt.isCorrect)) {
        setErrors((prev) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { correctAnswer, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  // Toggle correct answer
  const toggleCorrect = (id: string) => {
    const updatedOptions = options.map((opt) =>
      opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt
    );
    setOptions(updatedOptions);
    // Clear correct answer error when user marks an option as correct
    if (errors.correctAnswer && updatedOptions.some((opt) => opt.isCorrect)) {
      setErrors((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correctAnswer, ...rest } = prev;
        return rest;
      });
    }
  };

  // Clear error for a specific field
  const clearError = (
    field: 'title' | 'body' | 'questionBank' | 'options' | 'correctAnswer'
  ) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;

    // Validate title
    if (!title.trim()) {
      newErrors.title = 'Question title is required';
      isValid = false;
    }

    // Validate body
    if (!body.trim()) {
      newErrors.body = 'Question content is required';
      isValid = false;
    }

    // Validate question bank
    if (!selectedQuestionBankId) {
      newErrors.questionBank = 'Please select a question bank';
      isValid = false;
    }

    // Validate options for Multiple Choice
    if (questionType === QuestionType.Multichoice) {
      if (options.length < 2) {
        newErrors.options = 'Multiple choice questions need at least 2 options';
        isValid = false;
      } else {
        // Validate option text
        const optionTextErrors: { [key: string]: string } = {};
        options.forEach((opt) => {
          if (!opt.optionText.trim()) {
            optionTextErrors[opt.id] = 'Option text is required';
            isValid = false;
          }
        });
        if (Object.keys(optionTextErrors).length > 0) {
          newErrors.optionText = optionTextErrors;
        }

        // Validate correct answer
        if (!options.some((opt) => opt.isCorrect)) {
          newErrors.correctAnswer = 'Please mark at least one correct answer';
          isValid = false;
        }
      }
    }

    // Set errors
    setErrors(newErrors);

    // Show toast for first error
    if (!isValid) {
      const firstError = Object.values(newErrors)[0];
      if (typeof firstError === 'string') {
        toast.error('Please fix the errors in the form', {
          description: firstError
        });
      } else if (newErrors.options) {
        toast.error(newErrors.options);
      } else if (newErrors.correctAnswer) {
        toast.error(newErrors.correctAnswer);
      }
    }

    return isValid;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const authorId = __helpers.getUserId();
      if (!authorId) {
        toast.error('User not authenticated. Please login.');
        return;
      }

      // Create question
      // For Paragraph type, include sample answer in metadata if provided
      let metadataJson = metadata.trim();
      if (questionType === QuestionType.Paragraph && sampleAnswer.trim()) {
        const metadataObj = {
          sampleAnswer: sampleAnswer.trim(),
          ...(metadata.trim() ? JSON.parse(metadata.trim()) : {})
        };
        metadataJson = JSON.stringify(metadataObj);
      }

      const questionData = {
        title: title.trim(),
        body: body.trim(),
        questionType: questionType,
        metadata: metadataJson || undefined,
        tags: tags.trim() || undefined,
        version: 1,
        isPublished: isPublished,
        questionBankId: selectedQuestionBankId,
        authorId: authorId
      };

      const questionResponse =
        await createQuestionMutation.mutateAsync(questionData);

      if (!questionResponse?.success) {
        toast.error('Failed to create question');
        return;
      }

      const createdQuestionId = questionResponse.data;

      // Create options for Multiple Choice questions only
      if (questionType === QuestionType.Multichoice && options.length > 0) {
        const optionPromises = options.map((option, index) =>
          createOptionMutation.mutateAsync({
            optionText: option.optionText,
            isCorrect: option.isCorrect,
            orderIdx: index,
            questionId: createdQuestionId
          })
        );

        await Promise.all(optionPromises);
      }

      toast.success('Question created successfully!', {
        description: `Question "${title}" has been created.`,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />
      });

      // Reset form
      setTitle('');
      setBody('');
      setMetadata('');
      setTags('');
      setIsPublished(false);
      setOptions([]);
      setSampleAnswer('');
      setSelectedQuestionBankId('');
      setErrors({});

      // Navigate back or to questions list
      setTimeout(() => {
        navigate('/questions');
      }, 1500);
    } catch (error) {
      console.error('Error creating question:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      toast.error('Failed to create question', {
        description: errorMessage
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
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
                Create New Question
              </h1>
              <p className="text-sm text-slate-600">
                Add a new question to your question bank
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
                  onValueChange={(value) => {
                    setSelectedQuestionBankId(value);
                    clearError('questionBank');
                  }}
                  disabled={loadingBanks}
                >
                  <SelectTrigger
                    id="questionBank"
                    className={
                      errors.questionBank
                        ? 'border-red-500 focus:border-red-500'
                        : ''
                    }
                  >
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
                      questionBanks.map(
                        (bank: {
                          questionBanksId: string;
                          title: string;
                          subject?: string;
                        }) => (
                          <SelectItem
                            key={bank.questionBanksId}
                            value={bank.questionBanksId}
                          >
                            {bank.title}
                            {bank.subject && ` - ${bank.subject}`}
                          </SelectItem>
                        )
                      )}
                  </SelectContent>
                </Select>
                {errors.questionBank && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.questionBank}</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Question Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a clear and concise question title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearError('title');
                  }}
                  className={
                    errors.title
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-300'
                  }
                />
                {errors.title && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.title}</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="body">Question Content *</Label>
                <Textarea
                  id="body"
                  placeholder="Enter the full question content or description"
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    clearError('body');
                  }}
                  rows={6}
                  className={
                    errors.body
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-300'
                  }
                />
                {errors.body && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.body}</span>
                  </div>
                )}
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
                    <CardTitle>Answer Options *</CardTitle>
                    <p className="mt-1 text-sm text-white/80">
                      {options.length}/10 options added
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addOption}
                    disabled={options.length >= 10}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {/* Options error message */}
                {errors.options && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.options}</span>
                  </div>
                )}
                {errors.correctAnswer && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.correctAnswer}</span>
                  </div>
                )}
                {options.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
                    <p className="text-slate-500">
                      No options added yet. Click "Add Option" to create answer
                      choices. (Maximum 10 options)
                    </p>
                  </div>
                ) : (
                  <>
                    {options.length >= 10 && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                        ⚠️ Maximum limit reached. You have added 10 options
                        (maximum allowed).
                      </div>
                    )}
                    {options.map((option, index) => (
                      <div key={option.id} className="space-y-2">
                        <div
                          className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${
                            errors.optionText?.[option.id]
                              ? 'border-red-300 bg-red-50'
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-700">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <Input
                              placeholder={`Option ${index + 1}`}
                              value={option.optionText}
                              onChange={(e) =>
                                updateOptionText(option.id, e.target.value)
                              }
                              className={
                                errors.optionText?.[option.id]
                                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                  : ''
                              }
                            />
                            {errors.optionText?.[option.id] && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle className="h-3 w-3" />
                                <span>{errors.optionText[option.id]}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant={option.isCorrect ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleCorrect(option.id)}
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
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
              disabled={createQuestionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              disabled={createQuestionMutation.isPending}
            >
              <Save className="h-4 w-4" />
              {createQuestionMutation.isPending
                ? 'Creating...'
                : 'Create Question'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
