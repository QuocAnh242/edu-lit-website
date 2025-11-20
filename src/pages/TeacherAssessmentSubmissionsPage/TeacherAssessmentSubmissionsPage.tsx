import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
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
  ArrowLeft
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

export default function TeacherAssessmentSubmissionsPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [selectedAttempt, setSelectedAttempt] =
    useState<AssignmentAttemptDto | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const userRole = __helpers.getUserRole();

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
      try {
        const result = await getAssessmentAnswersByAttemptId(
          selectedAttempt.attemptsId
        );
        // Handle both array and object with data property
        if (Array.isArray(result)) {
          return result;
        }
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
    enabled: !!selectedAttempt?.attemptsId && viewDialogOpen
  });

  const rawAnswers = (attemptAnswersData || []) as AssessmentAnswerDto[];

  // Filter duplicate answers - only keep the latest answer for each question
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

  const answers = Array.from(latestAnswersMap.values());

  // Fetch assessment questions to get question details
  const { data: assessmentQuestionsData } = useQuery({
    queryKey: ['assessment-questions', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;
      return await getAssessmentQuestionsByAssessmentId(Number(assessmentId));
    },
    enabled: !!assessmentId && viewDialogOpen
  });

  const assessmentQuestions = (assessmentQuestionsData?.data ||
    assessmentQuestionsData?.Data ||
    []) as AssessmentQuestionDto[];

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

  // Check if user is TEACHER - render access denied if not
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
                <h3 className="text-lg font-semibold">
                  Student Answers ({answers.length} of{' '}
                  {assessmentQuestions.length} questions answered)
                </h3>
                {assessmentQuestions.length === 0 ? (
                  <p className="py-8 text-center text-gray-500">
                    No questions found in this assessment.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Show all questions, with answers if available */}
                    {assessmentQuestions
                      .sort((a, b) => a.orderNum - b.orderNum)
                      .map((assessmentQuestion) => {
                        const answer = answers.find(
                          (a) =>
                            a.assessmentQuestionId ===
                            assessmentQuestion.assessmentQuestionId
                        );
                        return (
                          <AttemptAnswerItem
                            key={assessmentQuestion.assessmentQuestionId}
                            answer={answer}
                            assessmentQuestion={assessmentQuestion}
                          />
                        );
                      })}
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
  assessmentQuestion
}: {
  answer?: AssessmentAnswerDto;
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

  // Check if question was answered
  const isAnswered = !!answer;
  const selectedOption = answer
    ? options.find((opt) => opt.questionOptionId === answer.selectedOptionId)
    : null;
  const correctOptionLetter = assessmentQuestion?.correctAnswer || '';
  const correctOption = options.find((opt, idx) => {
    const letter = String.fromCharCode(65 + idx); // A, B, C, D
    return letter === correctOptionLetter;
  });

  // For multiple choice, find all correct options
  const sortedOptions = options.sort((a, b) => a.orderIdx - b.orderIdx);
  const correctAnswerLetters = sortedOptions
    .map((opt, idx) => ({ opt, letter: String.fromCharCode(65 + idx) }))
    .filter(({ opt }) => opt.isCorrect)
    .map(({ letter }) => letter);

  return (
    <Card
      className={`${
        !isAnswered
          ? 'border-gray-200 bg-gray-50/50'
          : answer.isCorrect
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
                {!isAnswered ? (
                  <Badge
                    variant="outline"
                    className="border-gray-400 text-gray-600"
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    Not Answered
                  </Badge>
                ) : answer.isCorrect ? (
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
              {correctAnswerLetters.length > 0 && (
                <p className="mb-2 text-xs font-medium text-green-700">
                  Correct Answer(s): {correctAnswerLetters.join(', ')}
                </p>
              )}
              <div className="space-y-2">
                {sortedOptions.map((option, idx) => {
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D
                  const isSelected =
                    selectedOption?.questionOptionId ===
                    option.questionOptionId;
                  const isCorrect = option.isCorrect;
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
                        {isCorrect && (
                          <Badge
                            variant="outline"
                            className="border-green-600 text-green-700"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
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
              {isAnswered ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap text-sm text-gray-700">
                    {selectedOption?.optionText ||
                      answer.selectedAnswer ||
                      'No answer provided'}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm italic text-gray-400">
                    No answer provided
                  </p>
                </div>
              )}
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
          {isAnswered && (
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
                    {question.questionType === 2
                      ? correctAnswerLetters.length > 0
                        ? correctAnswerLetters.join(', ')
                        : correctOptionLetter
                      : 'See reference answer above'}
                    {question.questionType === 2 && correctOption
                      ? `. ${correctOption.optionText}`
                      : ''}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
