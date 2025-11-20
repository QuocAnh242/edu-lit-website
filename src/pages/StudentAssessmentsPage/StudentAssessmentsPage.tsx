import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Clock,
  BookOpen,
  Play,
  Loader2,
  XCircle
} from 'lucide-react';
import {
  getAllAssessments,
  getAllAssignmentAttempts,
  deleteAssignmentAttempt,
  AssessmentDto,
  AssignmentAttemptDto
} from '@/services/assessment.api';
import { Skeleton } from '@/components/ui/skeleton';
import __helpers from '@/helpers';

export default function StudentAssessmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = __helpers.getUserId();
  const userRole = __helpers.getUserRole();

  // Fetch all assessments
  const { data: assessmentsData, isLoading: loadingAssessments } = useQuery({
    queryKey: ['assessments'],
    queryFn: async () => {
      return await getAllAssessments();
    }
  });

  const assessments = (assessmentsData?.data || []) as AssessmentDto[];

  // Fetch user's attempts
  const { data: attemptsData } = useQuery({
    queryKey: ['my-attempts', userId],
    queryFn: async () => {
      if (!userId) return { data: [] };
      const response = await getAllAssignmentAttempts();
      // Filter attempts for current user
      const allAttempts = (response.data || []) as AssignmentAttemptDto[];
      return {
        data: allAttempts.filter((attempt) => attempt.userId === userId)
      };
    },
    enabled: !!userId,
    staleTime: 0, // Always consider data stale to ensure fresh data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true // Refetch when window regains focus
  });

  const myAttempts = (attemptsData?.data || []) as AssignmentAttemptDto[];

  // Delete attempt mutation
  const deleteAttemptMutation = useMutation({
    mutationFn: async (attemptId: number) => {
      return await deleteAssignmentAttempt(attemptId);
    },
    onSuccess: () => {
      toast.success(
        'Attempt deleted successfully. You can now retake the assessment.'
      );
      // Invalidate and refetch attempts
      queryClient.invalidateQueries({ queryKey: ['my-attempts', userId] });
      queryClient.invalidateQueries({ queryKey: ['my-attempt'] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to delete attempt';
      toast.error(errorMessage);
    }
  });

  // Check if user is STUDENT - render access denied if not
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
              <Button onClick={() => navigate('/')}>Go Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter active assessments
  const activeAssessments = assessments.filter((a) => a.isActive !== false);

  const getAttemptForAssessment = (assessmentId: number) => {
    // Find the most recent completed attempt, or the in-progress attempt
    const attemptsForAssessment = myAttempts.filter(
      (attempt) => attempt.assessmentId === assessmentId
    );

    // If there's a completed attempt, return it (prefer completed over in-progress)
    const completedAttempt = attemptsForAssessment.find(
      (attempt) => attempt.completedAt
    );
    if (completedAttempt) {
      return completedAttempt;
    }

    // Otherwise return in-progress attempt
    return attemptsForAssessment.find((attempt) => !attempt.completedAt);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleStartAssessment = (assessment: AssessmentDto) => {
    const existingAttempt = getAttemptForAssessment(assessment.assessmentId);
    if (existingAttempt && existingAttempt.completedAt) {
      toast.info(
        'You have already completed this assessment. View results instead.'
      );
      navigate(`/assessments/${assessment.assessmentId}/results`);
      return;
    }
    navigate(`/assessments/${assessment.assessmentId}/take`);
  };

  const handleViewResults = (assessment: AssessmentDto) => {
    navigate(`/assessments/${assessment.assessmentId}/results`);
  };

  const handleRetake = async (assessment: AssessmentDto) => {
    const existingAttempt = getAttemptForAssessment(assessment.assessmentId);
    if (!existingAttempt) {
      navigate(`/assessments/${assessment.assessmentId}/take`);
      return;
    }

    if (
      window.confirm(
        'Are you sure you want to delete your previous attempt and retake this assessment? This action cannot be undone.'
      )
    ) {
      try {
        await deleteAttemptMutation.mutateAsync(existingAttempt.attemptsId);
        // Navigate to take assessment after deletion
        setTimeout(() => {
          navigate(`/assessments/${assessment.assessmentId}/take`);
        }, 500);
      } catch (error) {
        // Error is already handled in mutation
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 flex items-center gap-2 text-4xl font-bold text-cyan-600">
            <FileText className="h-10 w-10" />
            Available Assessments
          </h1>
          <p className="text-lg text-gray-600">
            Browse and take assessments assigned to you
          </p>
        </div>

        {/* Assessments Grid */}
        {loadingAssessments ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeAssessments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 text-xl font-semibold text-gray-700">
                  No assessments available
                </h3>
                <p className="text-gray-500">
                  There are no active assessments available at the moment.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeAssessments.map((assessment) => {
              const attempt = getAttemptForAssessment(assessment.assessmentId);
              const isCompleted = attempt?.completedAt;
              const isInProgress = attempt && !attempt.completedAt;

              return (
                <Card
                  key={assessment.assessmentId}
                  className="transition-all duration-300 hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="flex-1 text-lg">
                        {assessment.title}
                      </CardTitle>
                      <Badge
                        variant={assessment.isActive ? 'default' : 'secondary'}
                      >
                        {assessment.status || 'Active'}
                      </Badge>
                    </div>
                    {assessment.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {assessment.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {assessment.totalQuestions} questions
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(assessment.durationMinutes)}
                        </div>
                      </div>

                      {isCompleted && (
                        <Badge className="w-full justify-center bg-green-600">
                          Completed
                        </Badge>
                      )}

                      {isInProgress && (
                        <Badge
                          variant="secondary"
                          className="w-full justify-center"
                        >
                          In Progress
                        </Badge>
                      )}

                      <div className="flex gap-2">
                        {isCompleted ? (
                          <>
                            <Button
                              onClick={() => handleViewResults(assessment)}
                              className="flex-1"
                              variant="outline"
                            >
                              View Results
                            </Button>
                            <Button
                              onClick={() => handleRetake(assessment)}
                              className="flex-1"
                              variant="outline"
                              disabled={deleteAttemptMutation.isPending}
                            >
                              {deleteAttemptMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                'Retake'
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => handleStartAssessment(assessment)}
                            className="flex-1"
                            disabled={!userId}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            {isInProgress ? 'Continue' : 'Start'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
