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
  Loader2,
  XCircle as XCircleIcon
} from 'lucide-react';
import {
  getAssessmentById,
  getAssignmentAttemptsByAssessmentId,
  getAssessmentAnswersByAttemptId,
  getGradingFeedback,
  AssignmentAttemptDto,
  AssessmentAnswerDto,
  GradingFeedbackDto
} from '@/services/assessment.api';
import {
  getQuestionById,
  getQuestionOptionsByQuestionId
} from '@/services/question.api';
import { QuestionDto, QuestionOptionDto } from '@/queries/question.query';
import { Skeleton } from '@/components/ui/skeleton';
import __helpers from '@/helpers';

export default function StudentAssessmentResultsPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const userId = __helpers.getUserId();

  // Check if user is STUDENT
  const userRole = __helpers.getUserRole();
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
          return Array.isArray((result as any).data)
            ? (result as any).data
            : [];
        }
        return [];
      } catch (error) {
        console.error('Error fetching answers:', error);
        return [];
      }
    },
    enabled: !!myAttempt?.attemptsId
  });

  // Ensure answers is always an array
  const answers = Array.isArray(answersData)
    ? answersData
    : ([] as AssessmentAnswerDto[]);

  // Fetch grading feedback
  const { data: gradingData, isLoading: loadingGrading } = useQuery({
    queryKey: ['grading-feedback', myAttempt?.attemptsId],
    queryFn: async () => {
      if (!myAttempt?.attemptsId) return null;
      try {
        const result = await getGradingFeedback(myAttempt.attemptsId);
        return result.data;
      } catch {
        return null;
      }
    },
    enabled: !!myAttempt?.attemptsId
  });

  const grading = gradingData as GradingFeedbackDto | null;

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

  const scoreBadge = grading ? getScoreBadge(grading.totalScore) : null;

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

        {/* Score Summary */}
        {grading && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Your Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <div className="text-center">
                  <p className="mb-1 text-sm text-gray-600">Total Score</p>
                  <p
                    className={`text-4xl font-bold ${getScoreColor(grading.totalScore)}`}
                  >
                    {grading.totalScore.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500">out of 10</p>
                </div>
                <div className="text-center">
                  <p className="mb-1 text-sm text-gray-600">Correct</p>
                  <p className="text-4xl font-bold text-green-600">
                    {grading.correctCount}
                  </p>
                  <p className="text-sm text-gray-500">
                    {grading.correctPercentage.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="mb-1 text-sm text-gray-600">Wrong</p>
                  <p className="text-4xl font-bold text-red-600">
                    {grading.wrongCount}
                  </p>
                  <p className="text-sm text-gray-500">
                    {grading.wrongPercentage.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="mb-1 text-sm text-gray-600">Grade</p>
                  {scoreBadge && (
                    <Badge
                      className={scoreBadge.className}
                      variant={scoreBadge.variant}
                    >
                      {scoreBadge.label}
                    </Badge>
                  )}
                </div>
              </div>
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
                {answers.map((answer, index) => (
                  <AnswerReviewItem
                    key={answer.answerId}
                    answer={answer}
                    index={index + 1}
                  />
                ))}
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
  index
}: {
  answer: AssessmentAnswerDto;
  index: number;
}) {
  const [question, setQuestion] = useState<QuestionDto | null>(null);
  const [options, setOptions] = useState<QuestionOptionDto[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        // Note: We need to get questionId from assessmentQuestion
        // This is simplified - you may need to adjust based on your API structure
        setLoading(false);
      } catch (error) {
        console.error('Error fetching question:', error);
        setLoading(false);
      }
    };
    fetchQuestionData();
  }, [answer.assessmentQuestionId]);

  return (
    <Card
      className={
        answer.isCorrect
          ? 'border-green-200 bg-green-50'
          : 'border-red-200 bg-red-50'
      }
    >
      <CardContent className="pt-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Question {index}</Badge>
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
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Selected Option ID:{' '}
            {answer.selectedOptionId || answer.selectedAnswer}
          </p>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div>
              {/* Question and options would be displayed here */}
              {/* This is a simplified version */}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
