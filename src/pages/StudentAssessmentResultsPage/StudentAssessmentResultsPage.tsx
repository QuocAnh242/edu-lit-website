import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Trophy,
  XCircle as XCircleIcon
} from 'lucide-react';
import {
  getAssessmentById,
  getAssignmentAttemptsByAssessmentId,
  getAssessmentAnswersByAttemptId,
  getGradingFeedback,
  getAssessmentQuestionsByAssessmentId,
  AssignmentAttemptDto,
  AssessmentAnswerDto,
  AssessmentQuestionDto,
  GradingFeedbackDto
} from '@/services/assessment.api';
import {
  getQuestionById,
  getQuestionOptionsByQuestionId,
  QuestionOptionDto
} from '@/services/question.api';
import { QuestionDto } from '@/queries/question.query';
import { Skeleton } from '@/components/ui/skeleton';
import __helpers from '@/helpers';

export default function StudentAssessmentResultsPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const userId = __helpers.getUserId();
  const userRole = __helpers.getUserRole();

  // Fetch assessment
  const { data: assessmentData, isLoading: loadingAssessment } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: async () => {
      if (!assessmentId) throw new Error('Assessment ID is required');
      return await getAssessmentById(Number(assessmentId));
    },
    enabled: !!assessmentId
  });

  const assessment = assessmentData?.data;

  // Fetch user's attempt
  const { data: attemptsData, isLoading: loadingAttempts } = useQuery({
    queryKey: ['my-attempt', assessmentId, userId],
    queryFn: async () => {
      if (!assessmentId || !userId)
        throw new Error('Assessment ID and User ID are required');
      const response = await getAssignmentAttemptsByAssessmentId(
        Number(assessmentId)
      );
      const allAttempts = (response.data || []) as AssignmentAttemptDto[];
      const myAttempt = allAttempts.find(
        (a) => a.userId === userId && a.completedAt
      );
      return myAttempt || null;
    },
    enabled: !!assessmentId && !!userId
  });

  const myAttempt = attemptsData as AssignmentAttemptDto | null;

  // Fetch answers
  const { data: answersData, isLoading: loadingAnswers } = useQuery({
    queryKey: ['attempt-answers', myAttempt?.attemptsId],
    queryFn: async () => {
      if (!myAttempt?.attemptsId) return [];
      try {
        const result = await getAssessmentAnswersByAttemptId(
          myAttempt.attemptsId
        );
        // Ensure result is always an array
        if (Array.isArray(result)) {
          return result;
        }
        // If result is an object with data property, extract it
        if (result && typeof result === 'object' && 'data' in result) {
          const resultWithData = result as { data?: unknown };
          return Array.isArray(resultWithData.data) ? resultWithData.data : [];
        }
        return [];
      } catch (error) {
        console.error('Error fetching answers:', error);
        return [];
      }
    },
    enabled: !!myAttempt?.attemptsId
  });

  // Fetch assessment questions to get question details and filter duplicates
  const { data: assessmentQuestionsData } = useQuery({
    queryKey: ['assessment-questions', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;
      return await getAssessmentQuestionsByAssessmentId(Number(assessmentId));
    },
    enabled: !!assessmentId
  });

  const assessmentQuestions = (assessmentQuestionsData?.data ||
    assessmentQuestionsData?.Data ||
    []) as AssessmentQuestionDto[];

  // Filter duplicate answers - only keep the latest answer for each question
  const rawAnswers = Array.isArray(answersData)
    ? answersData
    : ([] as AssessmentAnswerDto[]);

  // Group by assessmentQuestionId and get only the latest answer for each question
  const latestAnswersMap = new Map<number, AssessmentAnswerDto>();
  rawAnswers.forEach((ans) => {
    const existing = latestAnswersMap.get(ans.assessmentQuestionId);
    if (
      !existing ||
      (ans.createdAt &&
        existing.createdAt &&
        new Date(ans.createdAt) > new Date(existing.createdAt))
    ) {
      latestAnswersMap.set(ans.assessmentQuestionId, ans);
    }
  });

  // Convert map to array and sort by assessment question order
  const answers = Array.from(latestAnswersMap.values()).sort((a, b) => {
    const aqA = assessmentQuestions.find(
      (aq) => aq.assessmentQuestionId === a.assessmentQuestionId
    );
    const aqB = assessmentQuestions.find(
      (aq) => aq.assessmentQuestionId === b.assessmentQuestionId
    );
    return (aqA?.orderNum || 0) - (aqB?.orderNum || 0);
  });

  // Fetch grading feedback
  const { data: gradingData, isLoading: loadingGrading } = useQuery({
    queryKey: ['grading-feedback', myAttempt?.attemptsId],
    queryFn: async () => {
      if (!myAttempt?.attemptsId) return null;
      try {
        const result = await getGradingFeedback(myAttempt.attemptsId);
        // Handle both camelCase and PascalCase response properties
        const responseData = result.data || result.Data;

        // Check if response indicates an error
        const errorCode = result.errorCode || result.ErrorCode;
        if (errorCode && errorCode !== '200' && errorCode !== '201') {
          // If 404, grading doesn't exist yet - that's okay, return null
          if (errorCode === '404') {
            console.log(
              'Grading feedback not found for attempt:',
              myAttempt.attemptsId
            );
            return null;
          }
          // For other errors, log but still return null
          console.warn(
            'Error getting grading feedback:',
            result.message || result.Message
          );
          return null;
        }

        return responseData;
      } catch (error: unknown) {
        console.error('Error fetching grading feedback:', error);
        // Don't throw - just return null so page can still show answers
        return null;
      }
    },
    enabled: !!myAttempt?.attemptsId,
    retry: false // Don't retry on 404
  });

  const grading = gradingData as GradingFeedbackDto | null;

  // Check if user is STUDENT - render access denied if not
  if (userRole !== 'STUDENT') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircleIcon className="mx-auto mb-4 h-16 w-16 text-red-500" />
              <h2 className="mb-2 text-2xl font-bold">Access Denied</h2>
              <p className="mb-4 text-gray-600">
                This page is only accessible to STUDENT role.
              </p>
              <Button onClick={() => navigate('/assessments')}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingAssessment || loadingAttempts) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="mb-6 h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!myAttempt) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="py-12 text-center">
                <FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <h2 className="mb-2 text-2xl font-bold">No Results Found</h2>
                <p className="mb-4 text-gray-600">
                  You haven't completed this assessment yet.
                </p>
                <Button
                  onClick={() => navigate(`/assessments/${assessmentId}/take`)}
                >
                  Take Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 9)
      return {
        label: 'Excellent',
        variant: 'default' as const,
        className: 'bg-green-600'
      };
    if (score >= 7)
      return {
        label: 'Good',
        variant: 'default' as const,
        className: 'bg-blue-600'
      };
    if (score >= 5)
      return {
        label: 'Average',
        variant: 'default' as const,
        className: 'bg-yellow-600'
      };
    return {
      label: 'Needs Improvement',
      variant: 'destructive' as const,
      className: 'bg-red-600'
    };
  };

  // Recalculate correct/wrong counts based on filtered (unique) answers
  // This ensures the counts match the actual number of questions in the assessment
  // The backend grading might include duplicate answers, so we recalculate on frontend
  const totalQuestions =
    assessment?.totalQuestions || assessmentQuestions.length || 0;
  const actualCorrectCount = answers.filter((a) => a.isCorrect).length;
  const actualWrongCount = answers.filter((a) => !a.isCorrect).length;
  const actualTotalScore =
    totalQuestions > 0 ? (actualCorrectCount / totalQuestions) * 10 : 0;
  const scoreBadge = getScoreBadge(actualTotalScore);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/assessments/student')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Button>
          <h1 className="mb-2 text-4xl font-bold text-cyan-600">
            Assessment Results
          </h1>
          <p className="text-lg text-gray-600">{assessment?.title}</p>
        </div>

        {/* Score Summary - Show even if grading is not available, calculate from answers */}
        {(grading || answers.length > 0) && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Your Score
                {loadingGrading && (
                  <span className="ml-2 text-sm text-gray-500">
                    (Loading...)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingGrading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-600">Loading score...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                  <div className="text-center">
                    <p className="mb-1 text-sm text-gray-600">Total Score</p>
                    <p
                      className={`text-4xl font-bold ${getScoreColor(
                        grading?.totalScore
                          ? Number(grading.totalScore)
                          : actualTotalScore
                      )}`}
                    >
                      {grading?.totalScore
                        ? Number(grading.totalScore).toFixed(1)
                        : actualTotalScore.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-500">out of 10</p>
                    <p className="mt-1 text-xs text-gray-400">
                      ({totalQuestions} questions)
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="mb-1 text-sm text-gray-600">Correct</p>
                    <p className="text-4xl font-bold text-green-600">
                      {grading?.correctCount ?? actualCorrectCount}
                    </p>
                    <p className="text-sm text-gray-500">
                      {grading?.correctPercentage
                        ? `${Number(grading.correctPercentage).toFixed(1)}%`
                        : totalQuestions > 0
                          ? (
                              (actualCorrectCount / totalQuestions) *
                              100
                            ).toFixed(1) + '%'
                          : '0.0%'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      of {totalQuestions} questions
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="mb-1 text-sm text-gray-600">Wrong</p>
                    <p className="text-4xl font-bold text-red-600">
                      {grading?.wrongCount ?? actualWrongCount}
                    </p>
                    <p className="text-sm text-gray-500">
                      {grading?.wrongPercentage
                        ? `${Number(grading.wrongPercentage).toFixed(1)}%`
                        : totalQuestions > 0
                          ? ((actualWrongCount / totalQuestions) * 100).toFixed(
                              1
                            ) + '%'
                          : '0.0%'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      of {totalQuestions} questions
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="mb-1 text-sm text-gray-600">Grade</p>
                    {grading?.grade ? (
                      <Badge
                        className={
                          grading.grade === 'A'
                            ? 'bg-green-600'
                            : grading.grade === 'B'
                              ? 'bg-blue-600'
                              : grading.grade === 'C'
                                ? 'bg-yellow-600'
                                : grading.grade === 'D'
                                  ? 'bg-orange-600'
                                  : 'bg-red-600'
                        }
                        variant="default"
                      >
                        {grading.grade}
                      </Badge>
                    ) : scoreBadge ? (
                      <Badge
                        className={scoreBadge.className}
                        variant={scoreBadge.variant}
                      >
                        {scoreBadge.label}
                      </Badge>
                    ) : null}
                    {grading?.performance && (
                      <p className="mt-1 text-xs text-gray-500">
                        {grading.performance}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Answers Review */}
        <Card>
          <CardHeader>
            <CardTitle>Answer Review</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnswers || loadingGrading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : answers.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                No answers to review.
              </p>
            ) : (
              <div className="space-y-4">
                {answers.map((answer) => {
                  const assessmentQuestion = assessmentQuestions.find(
                    (aq) =>
                      aq.assessmentQuestionId === answer.assessmentQuestionId
                  );
                  return (
                    <AnswerReviewItem
                      key={answer.answerId}
                      answer={answer}
                      assessmentQuestion={assessmentQuestion}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Component to display individual answer review
function AnswerReviewItem({
  answer,
  assessmentQuestion
}: {
  answer: AssessmentAnswerDto;
  assessmentQuestion?: AssessmentQuestionDto;
}) {
  const [question, setQuestion] = useState<QuestionDto | null>(null);
  const [options, setOptions] = useState<QuestionOptionDto[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchQuestionData = async () => {
      if (!assessmentQuestion?.questionId) {
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

        // Fetch question options (both multiple choice and paragraph questions use options)
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
  }, [assessmentQuestion?.questionId]);

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
            Question not found (ID: {assessmentQuestion?.questionId})
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedOption = options.find(
    (opt) => opt.questionOptionId === answer.selectedOptionId
  );
  const correctOptionLetter = assessmentQuestion?.correctAnswer || '';
  const correctOption = options.find((opt, idx) => {
    const letter = String.fromCharCode(65 + idx); // A, B, C, D
    return letter === correctOptionLetter;
  });

  return (
    <Card
      className={`${
        answer.isCorrect
          ? 'border-green-200 bg-green-50/50'
          : 'border-red-200 bg-red-50/50'
      }`}
    >
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Question Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline">
                  Question {assessmentQuestion?.orderNum || 'N/A'}
                </Badge>
                {answer.isCorrect ? (
                  <Badge className="bg-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Correct
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Incorrect
                  </Badge>
                )}
                {question.questionType === 1 && (
                  <Badge variant="secondary">📝 Paragraph</Badge>
                )}
                {question.questionType === 2 && (
                  <Badge variant="default">☑️ Multiple Choice</Badge>
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
          {question.questionType === 2 && options.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Options:</p>
              <div className="space-y-2">
                {options
                  .sort((a, b) => a.orderIdx - b.orderIdx)
                  .map((option, idx) => {
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D
                    const isSelected =
                      selectedOption?.questionOptionId ===
                      option.questionOptionId;
                    const isCorrect =
                      correctOption?.questionOptionId ===
                      option.questionOptionId;
                    const isStudentCorrect = isSelected && isCorrect;

                    return (
                      <div
                        key={option.questionOptionId}
                        className={`flex items-start gap-3 rounded-lg border p-3 ${
                          isSelected && !isCorrect
                            ? 'border-red-300 bg-red-100'
                            : isCorrect
                              ? 'border-green-300 bg-green-100'
                              : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                            isSelected && !isCorrect
                              ? 'bg-red-600 text-white'
                              : isCorrect
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {letter}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{option.optionText}</p>
                        </div>
                        <div className="flex gap-2">
                          {isSelected && (
                            <Badge
                              variant={
                                isStudentCorrect ? 'default' : 'destructive'
                              }
                              className={
                                isStudentCorrect ? 'bg-green-600' : 'bg-red-600'
                              }
                            >
                              Student's Answer
                            </Badge>
                          )}
                          {isCorrect && !isSelected && (
                            <Badge
                              variant="outline"
                              className="border-green-600 text-green-700"
                            >
                              Correct Answer
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Paragraph Answer Display */}
          {question.questionType === 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Student's Answer:
              </p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {selectedOption?.optionText ||
                    answer.selectedAnswer ||
                    'No answer provided'}
                </p>
              </div>
              {assessmentQuestion?.correctAnswer && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm font-medium text-green-700">
                    Expected Answer (Reference):
                  </p>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {assessmentQuestion.correctAnswer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Answer Summary */}
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Selected: </span>
                <span className="font-medium">
                  {selectedOption
                    ? `${String.fromCharCode(65 + selectedOption.orderIdx)}. ${selectedOption.optionText}`
                    : answer.selectedOptionId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Correct: </span>
                <span className="font-medium text-green-700">
                  {correctOptionLetter}
                  {correctOption ? `. ${correctOption.optionText}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
