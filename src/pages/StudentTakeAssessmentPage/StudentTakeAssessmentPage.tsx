import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  XCircle,
  Save,
  Send
} from 'lucide-react';
import {
  getAssessmentById,
  getAssessmentQuestionsByAssessmentId,
  createAssignmentAttempt,
  updateAssignmentAttempt,
  getAssignmentAttemptsByAssessmentId,
  createAssessmentAnswer,
  deleteAssessmentAnswer,
  getAssessmentAnswersByAttemptId,
  calculateGrading,
  AssessmentQuestionDto,
  AssessmentAnswerDto
} from '@/services/assessment.api';
import {
  getQuestionById,
  getQuestionOptionsByQuestionId,
  createQuestionOption,
  updateQuestionOption,
  QuestionOptionDto
} from '@/services/question.api';
import { QuestionDto } from '@/queries/question.query';
import { Skeleton } from '@/components/ui/skeleton';
import __helpers from '@/helpers';

interface QuestionWithData {
  assessmentQuestion: AssessmentQuestionDto;
  question: QuestionDto | null;
  options: QuestionOptionDto[];
  answer: AssessmentAnswerDto | null;
}

export default function StudentTakeAssessmentPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = __helpers.getUserId();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, string>>(new Map()); // assessmentQuestionId -> selectedOptionId(s) (comma-separated for multiple choice, or text for paragraph)
  const [paragraphAnswers, setParagraphAnswers] = useState<Map<number, string>>(
    new Map()
  ); // assessmentQuestionId -> paragraph text
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const paragraphSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Check if user is STUDENT
  const userRole = __helpers.getUserRole();
  if (userRole !== 'STUDENT') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
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

  // Fetch assessment questions
  const { data: questionsData, isLoading: loadingQuestions } = useQuery({
    queryKey: ['assessment-questions', assessmentId],
    queryFn: async () => {
      if (!assessmentId) throw new Error('Assessment ID is required');
      return await getAssessmentQuestionsByAssessmentId(Number(assessmentId));
    },
    enabled: !!assessmentId
  });

  const assessmentQuestions = (questionsData?.data ||
    questionsData?.Data ||
    []) as AssessmentQuestionDto[];

  // Fetch or create attempt
  useEffect(() => {
    const initializeAttempt = async () => {
      if (!assessmentId || !userId || !assessment) return;

      try {
        // Check for existing attempt
        const attemptsResponse = await getAssignmentAttemptsByAssessmentId(
          Number(assessmentId)
        );
        const allAttempts = (attemptsResponse.data || []) as any[];
        const myAttempt = allAttempts.find(
          (a: any) => a.userId === userId && !a.completedAt
        );

        if (myAttempt) {
          setAttemptId(myAttempt.attemptsId);
          // Load existing answers - only get the latest answer for each question
          const answersResponse = await getAssessmentAnswersByAttemptId(
            myAttempt.attemptsId
          );
          const existingAnswers = (answersResponse ||
            []) as AssessmentAnswerDto[];

          // Group by questionId and get only the latest answer for each question
          const latestAnswersMap = new Map<number, AssessmentAnswerDto>();
          existingAnswers.forEach((ans) => {
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

          const answersMap = new Map<number, string>();
          const paragraphMap = new Map<number, string>();

          // Group answers by question
          const questionIds = Array.from(
            new Set(existingAnswers.map((a) => a.assessmentQuestionId))
          );

          for (const questionId of questionIds) {
            const allAnswersForQuestion = existingAnswers.filter(
              (a) => a.assessmentQuestionId === questionId
            );

            if (allAnswersForQuestion.length > 1) {
              // Multiple answers (multiple choice with multiple selections)
              const optionIds = allAnswersForQuestion
                .map((a) => a.selectedOptionId)
                .filter((id) => id)
                .join(',');
              answersMap.set(questionId, optionIds);
            } else if (allAnswersForQuestion.length === 1) {
              const answer = allAnswersForQuestion[0];
              // Store the answer - we'll determine if it's paragraph or multiple choice when displaying
              // For now, store in answers map. We'll check question type when rendering.
              answersMap.set(questionId, answer.selectedOptionId || '');
            }
          }

          // Note: Paragraph answers will be loaded when the question is displayed
          // by fetching the option text if the question type is paragraph
          setAnswers(answersMap);
          setParagraphAnswers(paragraphMap);
        } else {
          // Create new attempt
          const createResponse = await createAssignmentAttempt({
            assessmentId: Number(assessmentId),
            userId: userId,
            attemptNumber: 1
          });
          if (createResponse.data) {
            setAttemptId(createResponse.data);
            // Update attempt with startedAt
            await updateAssignmentAttempt(createResponse.data, {
              attemptsId: createResponse.data,
              assessmentId: Number(assessmentId),
              userId: userId,
              startedAt: new Date().toISOString(),
              attemptNumber: 1
            });
          }
        }
      } catch (error) {
        console.error('Error initializing attempt:', error);
        toast.error('Failed to initialize assessment attempt');
      }
    };

    initializeAttempt();
  }, [assessmentId, userId, assessment]);

  // Initialize timer
  useEffect(() => {
    if (!assessment || !attemptId) return;

    const durationMs = assessment.durationMinutes * 60 * 1000;
    setTimeRemaining(durationMs);

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          handleAutoSubmit();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [assessment, attemptId]);

  // Fetch questions with their data
  const questionsWithData: QuestionWithData[] = assessmentQuestions.map(
    (aq) => ({
      assessmentQuestion: aq,
      question: null,
      options: [],
      answer: null
    })
  );

  // Fetch question details and options for current question
  const currentQuestion = assessmentQuestions[currentQuestionIndex];
  const { data: questionData } = useQuery({
    queryKey: ['question', currentQuestion?.questionId],
    queryFn: async () => {
      if (!currentQuestion?.questionId) return null;
      return await getQuestionById(currentQuestion.questionId);
    },
    enabled: !!currentQuestion?.questionId
  });

  const { data: optionsData } = useQuery({
    queryKey: ['question-options', currentQuestion?.questionId],
    queryFn: async () => {
      if (!currentQuestion?.questionId) return null;
      return await getQuestionOptionsByQuestionId(currentQuestion.questionId);
    },
    enabled: !!currentQuestion?.questionId
  });

  const currentQuestionData = questionData?.data as QuestionDto | undefined;
  const currentOptions = (optionsData?.data || []) as QuestionOptionDto[];
  const currentAnswer = answers.get(currentQuestion?.assessmentQuestionId || 0);

  // Load paragraph answer if this is a paragraph question
  const [currentParagraphAnswer, setCurrentParagraphAnswer] =
    useState<string>('');

  useEffect(() => {
    const loadParagraphAnswer = async () => {
      if (
        currentQuestionData?.questionType === 1 &&
        currentQuestion &&
        currentAnswer
      ) {
        // For paragraph questions, fetch the option to get the text
        try {
          const opts = await getQuestionOptionsByQuestionId(
            currentQuestion.questionId
          );
          const optsData = (opts.data || []) as QuestionOptionDto[];
          const option = optsData.find(
            (o) => o.questionOptionId === currentAnswer
          );
          if (option) {
            setCurrentParagraphAnswer(option.optionText);
          } else if (currentAnswer.length > 36) {
            // Might be stored as text directly
            setCurrentParagraphAnswer(currentAnswer);
          }
        } catch (e) {
          // If fetching fails, try using selectedOptionId as text
          if (currentAnswer.length > 36) {
            setCurrentParagraphAnswer(currentAnswer);
          }
        }
      } else {
        setCurrentParagraphAnswer('');
      }
    };

    loadParagraphAnswer();
  }, [currentQuestionData, currentQuestion, currentAnswer]);

  // Check if multiple choice question has multiple correct answers (allows multiple selection)
  const hasMultipleCorrectAnswers =
    currentQuestionData?.questionType === 2 &&
    currentOptions.filter((opt) => opt.isCorrect).length > 1;

  // Save answer mutation
  const saveAnswerMutation = useMutation({
    mutationFn: async ({
      assessmentQuestionId,
      selectedOptionIds,
      paragraphText
    }: {
      assessmentQuestionId: number;
      selectedOptionIds?: string[];
      paragraphText?: string;
    }) => {
      if (!attemptId) throw new Error('Attempt ID is required');

      // Get all answers for this attempt
      const allAnswers = await getAssessmentAnswersByAttemptId(attemptId);

      // Find all answers for this specific question
      const questionAnswers = (allAnswers || []).filter(
        (ans: AssessmentAnswerDto) =>
          ans.assessmentQuestionId === assessmentQuestionId
      );

      // Delete all existing answers for this question first
      if (questionAnswers.length > 0) {
        for (const ans of questionAnswers) {
          try {
            await deleteAssessmentAnswer(ans.answerId);
          } catch (error) {
            console.error(`Failed to delete answer ${ans.answerId}:`, error);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Create new answer(s)
      if (paragraphText !== undefined && paragraphText.trim() !== '') {
        // For paragraph questions, we need to create or update a QuestionOption to store the text
        if (currentQuestion?.questionId) {
          const options = await getQuestionOptionsByQuestionId(
            currentQuestion.questionId
          );
          const optionsData = (options.data || []) as QuestionOptionDto[];

          // For paragraph questions, we need to create or update an option to store the text
          // Check if there's already an answer for this question in this attempt
          const existingAnswer =
            questionAnswers.length > 0 ? questionAnswers[0] : null;

          let optionId: string;

          if (existingAnswer && existingAnswer.selectedOptionId) {
            // Check if the option exists and belongs to this question
            const existingOption = optionsData.find(
              (opt) => opt.questionOptionId === existingAnswer.selectedOptionId
            );

            if (existingOption) {
              // Update the existing option with new text
              await updateQuestionOption(existingOption.questionOptionId, {
                questionOptionId: existingOption.questionOptionId,
                optionText: paragraphText,
                isCorrect: existingOption.isCorrect,
                orderIdx: existingOption.orderIdx
              });
              optionId = existingOption.questionOptionId;
            } else {
              // Option doesn't exist anymore, create a new one
              const createOptionResponse = await createQuestionOption({
                optionText: paragraphText,
                isCorrect: false,
                orderIdx: optionsData.length,
                questionId: currentQuestion.questionId
              });

              if (!createOptionResponse.data) {
                throw new Error(
                  'Failed to create question option for paragraph answer'
                );
              }
              optionId = createOptionResponse.data;
            }
          } else {
            // No existing answer, create a new option
            const createOptionResponse = await createQuestionOption({
              optionText: paragraphText,
              isCorrect: false,
              orderIdx: optionsData.length,
              questionId: currentQuestion.questionId
            });

            if (!createOptionResponse.data) {
              throw new Error(
                'Failed to create question option for paragraph answer'
              );
            }
            optionId = createOptionResponse.data;
          }

          // Now create the assessment answer using the option ID
          await createAssessmentAnswer({
            assessmentQuestionId: assessmentQuestionId,
            attemptsId: attemptId,
            selectedOptionId: optionId
          });
        }
      } else if (selectedOptionIds && selectedOptionIds.length > 0) {
        // For multiple choice, create one answer record per selected option
        for (const optionId of selectedOptionIds) {
          await createAssessmentAnswer({
            assessmentQuestionId: assessmentQuestionId,
            attemptsId: attemptId,
            selectedOptionId: optionId
          });
        }
      }
    }
  });

  const handleAnswerChange = async (selectedOptionId: string) => {
    if (!currentQuestion || !currentQuestionData) return;

    // For single-select multiple choice (old behavior)
    if (currentQuestionData.questionType === 2) {
      const newAnswers = new Map(answers);
      newAnswers.set(currentQuestion.assessmentQuestionId, selectedOptionId);
      setAnswers(newAnswers);

      try {
        await saveAnswerMutation.mutateAsync({
          assessmentQuestionId: currentQuestion.assessmentQuestionId,
          selectedOptionIds: [selectedOptionId]
        });
      } catch (error) {
        console.error('Error saving answer:', error);
        toast.error('Failed to save answer');
      }
    }
  };

  const handleMultipleChoiceChange = async (
    optionId: string,
    checked: boolean
  ) => {
    if (!currentQuestion || !currentQuestionData) return;
    if (currentQuestionData.questionType !== 2) return;

    const currentAnswerStr =
      answers.get(currentQuestion.assessmentQuestionId) || '';
    const currentSelected = currentAnswerStr
      ? currentAnswerStr.split(',').filter((id) => id)
      : [];

    let newSelected: string[];
    if (checked) {
      newSelected = [...currentSelected, optionId];
    } else {
      newSelected = currentSelected.filter((id) => id !== optionId);
    }

    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.assessmentQuestionId, newSelected.join(','));
    setAnswers(newAnswers);

    try {
      await saveAnswerMutation.mutateAsync({
        assessmentQuestionId: currentQuestion.assessmentQuestionId,
        selectedOptionIds: newSelected
      });
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save answer');
    }
  };

  const handleParagraphChange = (text: string) => {
    if (!currentQuestion || !currentQuestionData) return;
    if (currentQuestionData.questionType !== 1) return;

    const newParagraphAnswers = new Map(paragraphAnswers);
    newParagraphAnswers.set(currentQuestion.assessmentQuestionId, text);
    setParagraphAnswers(newParagraphAnswers);
    setCurrentParagraphAnswer(text); // Update local state immediately

    // Clear existing timeout
    if (paragraphSaveTimeoutRef.current) {
      clearTimeout(paragraphSaveTimeoutRef.current);
    }

    // Debounce auto-save for paragraph answers (save after 1 second of no typing)
    paragraphSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveAnswerMutation.mutateAsync({
          assessmentQuestionId: currentQuestion.assessmentQuestionId,
          paragraphText: text
        });
      } catch (error) {
        console.error('Error saving answer:', error);
        toast.error('Failed to save answer');
      }
    }, 1000);
  };

  const handleNext = () => {
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAutoSubmit = async () => {
    if (!attemptId || !assessmentId) return;
    setIsSubmitting(true);

    try {
      // Mark attempt as completed
      await updateAssignmentAttempt(attemptId, {
        attemptsId: attemptId,
        assessmentId: Number(assessmentId),
        userId: userId || '',
        completedAt: new Date().toISOString(),
        attemptNumber: 1
      });

      // Calculate grading
      await calculateGrading({ attemptId });

      // Invalidate cache to refresh attempts list
      queryClient.invalidateQueries({ queryKey: ['my-attempts', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-attempt'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-attempts'] });

      toast.success('Assessment submitted successfully!');
      navigate(`/assessments/${assessmentId}/results`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    setShowSubmitDialog(true);
  };

  const confirmSubmit = async () => {
    setShowSubmitDialog(false);
    await handleAutoSubmit();
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loadingAssessment || loadingQuestions || !attemptId) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header with Timer */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{assessment?.title}</CardTitle>
                <p className="mt-1 text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of{' '}
                  {assessmentQuestions.length}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Clock
                      className={`h-5 w-5 ${timeRemaining < 5 * 60 * 1000 ? 'text-red-500' : ''}`}
                    />
                    <span
                      className={
                        timeRemaining < 5 * 60 * 1000 ? 'text-red-500' : ''
                      }
                    >
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Time Remaining</p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left Sidebar - Questions Table */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Questions Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {assessmentQuestions.map((question, index) => {
                    const isAnswered =
                      answers.has(question.assessmentQuestionId) ||
                      paragraphAnswers.has(question.assessmentQuestionId);
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <button
                        key={question.assessmentQuestionId}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`
                          aspect-square w-full rounded-md border-2 text-sm font-medium transition-all
                          ${
                            isCurrent
                              ? 'scale-105 border-cyan-700 bg-cyan-600 text-white shadow-md'
                              : isAnswered
                                ? 'border-green-300 bg-green-100 text-green-700 hover:bg-green-200'
                                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
                          }
                        `}
                        title={`Question ${index + 1}${isAnswered ? ' (Answered)' : ' (Not answered)'}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Progress Summary */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold">
                      {answers.size} / {assessmentQuestions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-semibold">
                      {Math.round(
                        (answers.size / assessmentQuestions.length) * 100
                      )}
                      %
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="border-t pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Assessment
                      </>
                    )}
                  </Button>
                </div>

                {/* Legend */}
                <div className="space-y-2 border-t pt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2 border-cyan-700 bg-cyan-600"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2 border-green-300 bg-green-100"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2 border-gray-300 bg-white"></div>
                    <span>Not Answered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Question Card */}
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      disabled={
                        currentQuestionIndex >= assessmentQuestions.length - 1
                      }
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentQuestionData ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">
                        {currentQuestionData.title}
                      </h3>
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: currentQuestionData.body
                        }}
                      />
                    </div>

                    {/* Multiple Choice Questions */}
                    {currentQuestionData.questionType === 2 && (
                      <>
                        {hasMultipleCorrectAnswers ? (
                          // Multiple selection (checkboxes) - for questions with multiple correct answers
                          <div className="space-y-3">
                            <p className="text-sm italic text-gray-600">
                              Select all correct answers (this question has
                              multiple correct answers)
                            </p>
                            {currentOptions
                              .sort((a, b) => a.orderIdx - b.orderIdx)
                              .map((option) => {
                                const currentSelected = currentAnswer
                                  ? currentAnswer.split(',').filter((id) => id)
                                  : [];
                                const isChecked = currentSelected.includes(
                                  option.questionOptionId
                                );

                                return (
                                  <div
                                    key={option.questionOptionId}
                                    className="flex cursor-pointer items-start space-x-3 rounded-md border p-3 hover:bg-gray-50"
                                  >
                                    <Checkbox
                                      id={option.questionOptionId}
                                      checked={isChecked}
                                      onCheckedChange={(checked) =>
                                        handleMultipleChoiceChange(
                                          option.questionOptionId,
                                          checked as boolean
                                        )
                                      }
                                      className="mt-1"
                                    />
                                    <Label
                                      htmlFor={option.questionOptionId}
                                      className="flex-1 cursor-pointer"
                                    >
                                      <div className="font-medium">
                                        {String.fromCharCode(
                                          65 + option.orderIdx
                                        )}
                                        . {option.optionText}
                                      </div>
                                    </Label>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          // Single selection (radio buttons) - for questions with single correct answer
                          <RadioGroup
                            value={currentAnswer || ''}
                            onValueChange={handleAnswerChange}
                          >
                            <div className="space-y-3">
                              {currentOptions
                                .sort((a, b) => a.orderIdx - b.orderIdx)
                                .map((option) => (
                                  <div
                                    key={option.questionOptionId}
                                    className="flex cursor-pointer items-start space-x-3 rounded-md border p-3 hover:bg-gray-50"
                                  >
                                    <RadioGroupItem
                                      value={option.questionOptionId}
                                      id={option.questionOptionId}
                                      className="mt-1"
                                    />
                                    <Label
                                      htmlFor={option.questionOptionId}
                                      className="flex-1 cursor-pointer"
                                    >
                                      <div className="font-medium">
                                        {String.fromCharCode(
                                          65 + option.orderIdx
                                        )}
                                        . {option.optionText}
                                      </div>
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </RadioGroup>
                        )}
                      </>
                    )}

                    {/* Paragraph Questions */}
                    {currentQuestionData.questionType === 1 && (
                      <div className="space-y-3">
                        <Label
                          htmlFor="paragraph-answer"
                          className="text-sm font-medium"
                        >
                          Your Answer:
                        </Label>
                        <Textarea
                          id="paragraph-answer"
                          placeholder="Type your answer here..."
                          value={currentParagraphAnswer || ''}
                          onChange={(e) =>
                            handleParagraphChange(e.target.value)
                          }
                          rows={8}
                          className="min-h-[200px] resize-y"
                        />
                        <p className="text-xs text-gray-500">
                          Your answer is automatically saved as you type.
                        </p>
                      </div>
                    )}

                    {(currentAnswer || currentParagraphAnswer) && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Save className="h-4 w-4" />
                        <span className="text-sm">Answer saved</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your assessment? You have answered{' '}
              {answers.size} out of {assessmentQuestions.length} questions. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              Submit Assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
