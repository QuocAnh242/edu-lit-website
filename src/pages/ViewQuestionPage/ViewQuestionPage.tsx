import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import {
  getQuestionById,
  getQuestionOptionsByQuestionId,
  QuestionOptionDto
} from '@/services/question.api';
import { QuestionDto, QuestionType } from '@/queries/question.query';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/shared/navbar';

export default function ViewQuestionPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();

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
  const {
    data: optionsData,
    isLoading: loadingOptions,
    isError: optionsError
  } = useQuery({
    queryKey: ['question-options', questionId],
    queryFn: async () => {
      if (!questionId) throw new Error('Question ID is required');
      return await getQuestionOptionsByQuestionId(questionId);
    },
    enabled:
      !!questionId &&
      questionData?.data?.questionType === QuestionType.Multichoice
  });

  const question = questionData?.data as QuestionDto | undefined;
  const options = (optionsData?.data || []) as QuestionOptionDto[];

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
              <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
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

  // Parse metadata for sample answer if available
  let sampleAnswer = '';
  if (question.metadata) {
    try {
      const metadata = JSON.parse(question.metadata);
      if (metadata.sampleAnswer) {
        sampleAnswer = metadata.sampleAnswer;
      }
    } catch (e) {
      // Metadata is not JSON or doesn't contain sampleAnswer
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/questions')}
              className="hover:bg-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Question Details
              </h1>
              <p className="text-sm text-slate-600">
                View question information and options
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={question.isPublished ? 'default' : 'secondary'}>
              {question.isPublished ? 'Published' : 'Draft'}
            </Badge>
            <Button
              onClick={() => navigate(`/questions/edit/${question.questionId}`)}
              className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              <Edit className="h-4 w-4" />
              Edit Question
            </Button>
          </div>
        </div>

        {/* Question Details Card */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Question Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Question Type */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Type:</span>
              {question.questionType === QuestionType.Paragraph ? (
                <Badge variant="secondary">📝 Paragraph</Badge>
              ) : (
                <Badge variant="default">☑️ Multiple Choice</Badge>
              )}
            </div>

            {/* Title */}
            <div>
              <Label className="text-sm font-medium text-slate-600">
                Title
              </Label>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {question.title}
              </p>
            </div>

            {/* Body */}
            <div>
              <Label className="text-sm font-medium text-slate-600">
                Content
              </Label>
              <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="whitespace-pre-wrap text-slate-800">
                  {question.body}
                </p>
              </div>
            </div>

            {/* Sample Answer (for Paragraph type) */}
            {question.questionType === QuestionType.Paragraph &&
              sampleAnswer && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">
                    Sample Answer
                  </Label>
                  <div className="mt-1 rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="whitespace-pre-wrap text-slate-800">
                      {sampleAnswer}
                    </p>
                  </div>
                </div>
              )}

            {/* Tags */}
            {question.tags && (
              <div>
                <Label className="text-sm font-medium text-slate-600">
                  Tags
                </Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {question.tags.split(',').map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {question.metadata && !sampleAnswer && (
              <div>
                <Label className="text-sm font-medium text-slate-600">
                  Metadata
                </Label>
                <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <pre className="overflow-x-auto text-xs text-slate-600">
                    {question.metadata}
                  </pre>
                </div>
              </div>
            )}

            {/* Metadata Info */}
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <Label className="text-xs text-slate-500">Version</Label>
                <p className="text-sm font-medium text-slate-900">
                  {question.version}
                </p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Created At</Label>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(question.createdAt).toLocaleString()}
                </p>
              </div>
              {question.updatedAt && (
                <div>
                  <Label className="text-xs text-slate-500">Updated At</Label>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(question.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Options Card (Only for Multiple Choice) */}
        {question.questionType === QuestionType.Multichoice && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Answer Options
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {options.length} {options.length === 1 ? 'Option' : 'Options'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingOptions ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : optionsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
                  Failed to load options
                </div>
              ) : options.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center text-slate-500">
                  No options available for this question
                </div>
              ) : (
                <div className="space-y-3">
                  {options
                    .sort((a, b) => a.orderIdx - b.orderIdx)
                    .map((option, index) => (
                      <div
                        key={option.questionOptionId}
                        className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${
                          option.isCorrect
                            ? 'border-green-300 bg-green-50'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                            option.isCorrect
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-800">{option.optionText}</p>
                        </div>
                        {option.isCorrect && (
                          <Badge
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Correct
                          </Badge>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Simple Label component for consistent styling
const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return <label className={`block ${className}`}>{children}</label>;
};
