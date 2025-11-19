import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  FileText,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import {
  getAssessmentById,
  getAllAssignmentAttempts,
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

export default function TeacherAssessmentSubmissionsPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [selectedAttempt, setSelectedAttempt] =
    useState<AssignmentAttemptDto | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Check if user is TEACHER
  const userRole = __helpers.getUserRole();
  if (userRole !== 'TEACHER') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
              <h2 className="mb-2 text-2xl font-bold">Access Denied</h2>
              <p className="mb-4 text-gray-600">
                This page is only accessible to TEACHER role.
              </p>
              <Button onClick={() => navigate('/assessments')}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch assessment details
  const { data: assessmentData, isLoading: loadingAssessment } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: async () => {
      if (!assessmentId) throw new Error('Assessment ID is required');
      return await getAssessmentById(Number(assessmentId));
    },
    enabled: !!assessmentId
  });

  const assessment = assessmentData?.data;

  // Fetch assignment attempts
  const { data: attemptsData, isLoading: loadingAttempts } = useQuery({
    queryKey: ['assignment-attempts', assessmentId],
    queryFn: async () => {
      if (!assessmentId) throw new Error('Assessment ID is required');
      return await getAssignmentAttemptsByAssessmentId(Number(assessmentId));
    },
    enabled: !!assessmentId
  });

  const attempts = (attemptsData?.data || []) as AssignmentAttemptDto[];

  // Fetch attempt details when viewing
  const { data: attemptAnswersData, isLoading: loadingAnswers } = useQuery({
    queryKey: ['attempt-answers', selectedAttempt?.attemptsId],
    queryFn: async () => {
      if (!selectedAttempt?.attemptsId) return [];
      return await getAssessmentAnswersByAttemptId(selectedAttempt.attemptsId);
    },
    enabled: !!selectedAttempt?.attemptsId && viewDialogOpen
  });

  const answers = (attemptAnswersData || []) as AssessmentAnswerDto[];

  // Fetch grading feedback
  const { data: gradingData } = useQuery({
    queryKey: ['grading-feedback', selectedAttempt?.attemptsId],
    queryFn: async () => {
      if (!selectedAttempt?.attemptsId) return null;
      try {
        // Try to get grading feedback - it might not exist yet
        const result = await getGradingFeedback(selectedAttempt.attemptsId);
        return result.data;
      } catch {
        return null;
      }
    },
    enabled: !!selectedAttempt?.attemptsId && viewDialogOpen
  });

  const grading = gradingData as GradingFeedbackDto | null;

  const handleViewAttempt = (attempt: AssignmentAttemptDto) => {
    setSelectedAttempt(attempt);
    setViewDialogOpen(true);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/assessments')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 flex items-center gap-2 text-4xl font-bold text-cyan-600">
                <FileText className="h-10 w-10" />
                {loadingAssessment
                  ? 'Loading...'
                  : assessment?.title || 'Assessment Submissions'}
              </h1>
              <p className="text-lg text-gray-600">
                View and review student submissions
              </p>
            </div>
          </div>
        </div>

        {/* Assessment Info */}
        {assessment && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Assessment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-500">Total Questions</p>
                  <p className="text-lg font-semibold">
                    {assessment.totalQuestions}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="text-lg font-semibold">
                    {formatDuration(assessment.durationMinutes)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Submissions</p>
                  <p className="text-lg font-semibold">{attempts.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge
                    variant={assessment.isActive ? 'default' : 'secondary'}
                  >
                    {assessment.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Submissions ({attempts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAttempts ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : attempts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 text-xl font-semibold text-gray-700">
                  No submissions yet
                </h3>
                <p className="text-gray-500">
                  Students haven't submitted any attempts for this assessment
                  yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Attempt #</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Completed At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt) => (
                    <TableRow key={attempt.attemptsId}>
                      <TableCell className="font-medium">
                        {attempt.userId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          #{attempt.attemptNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(attempt.startedAt)}</TableCell>
                      <TableCell>
                        {attempt.completedAt ? (
                          <span className="text-green-600">
                            {formatDate(attempt.completedAt)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not completed</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {attempt.completedAt ? (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            In Progress
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewAttempt(attempt)}
                          title="View submission"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* View Attempt Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Submission Details - Attempt #{selectedAttempt?.attemptNumber}
            </DialogTitle>
            <DialogDescription>
              Student ID: {selectedAttempt?.userId}
            </DialogDescription>
          </DialogHeader>

          {loadingAnswers ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grading Summary */}
              {grading && (
                <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Grading Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Score</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {grading.totalScore}/10
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Correct</p>
                        <p className="text-2xl font-bold text-green-600">
                          {grading.correctCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Wrong</p>
                        <p className="text-2xl font-bold text-red-600">
                          {grading.wrongCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Accuracy</p>
                        <p className="text-2xl font-bold text-cyan-600">
                          {grading.correctPercentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Answers List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Student Answers</h3>
                {answers.length === 0 ? (
                  <p className="py-8 text-center text-gray-500">
                    No answers submitted yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {answers.map((answer, index) => (
                      <AttemptAnswerItem
                        key={answer.answerId}
                        answer={answer}
                        index={index + 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component to display individual answer
function AttemptAnswerItem({
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
        // Get assessment question to find questionId
        // Note: We need to get the questionId from the assessment question
        // For now, we'll need to fetch it differently
        // This is a simplified version - you may need to adjust based on your API
        setLoading(false);
      } catch (error) {
        console.error('Error fetching question:', error);
        setLoading(false);
      }
    };
    fetchQuestionData();
  }, [answer.assessmentQuestionId]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
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
            <p className="text-sm text-gray-600">
              Selected Option ID:{' '}
              {answer.selectedOptionId || answer.selectedAnswer}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
