import BaseRequest from '@/config/axios.config';

// ============================================================================
// Types
// ============================================================================

// ObjectResponse structure from backend
// Note: Backend uses PascalCase (ErrorCode, Message, Data)
// but JSON serialization typically converts to camelCase
export interface ObjectResponse<T> {
  errorCode?: string;
  message?: string;
  data?: T;
  // Also support PascalCase in case backend returns it directly
  ErrorCode?: string;
  Message?: string;
  Data?: T;
}

// Assessment Types
export interface AssessmentDto {
  assessmentId: number;
  courseId: string;
  creatorId: string;
  title: string;
  description?: string;
  totalQuestions: number;
  durationMinutes: number;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAssessmentRequest {
  courseId: string;
  creatorId: string;
  title: string;
  description?: string;
  totalQuestions: number;
  durationMinutes: number;
}

export interface UpdateAssessmentRequest {
  id: number;
  courseId: string;
  creatorId: string;
  title: string;
  description?: string;
  totalQuestions: number;
  durationMinutes: number;
}

// Assessment Question Types
export interface AssessmentQuestionDto {
  assessmentQuestionId: number;
  assessmentId: number;
  questionId: string;
  orderNum: number;
  correctAnswer: string; // A, B, C, D
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAssessmentQuestionRequest {
  assessmentId: number;
  questionId: string;
  orderNum: number;
  correctAnswer: string; // A, B, C, D
}

export interface CreateAssessmentQuestionsRequest {
  assessmentId: number;
  questionIds: string[]; // Array of question IDs (Guid)
}

export interface UpdateAssessmentQuestionRequest {
  assessmentQuestionId: number;
  assessmentId: number;
  questionId: string;
  orderNum: number;
  correctAnswer: string;
}

// Assessment Answer Types
export interface AssessmentAnswerDto {
  answerId: number;
  assessmentQuestionId: number;
  attemptsId: number;
  selectedOptionId: string; // Guid of QuestionOption
  isCorrect: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Legacy field for backward compatibility
  selectedAnswer?: string;
}

export interface CreateAssessmentAnswerRequest {
  assessmentQuestionId: number;
  attemptsId: number;
  selectedOptionId: string; // Guid of QuestionOption
}

export interface UpdateAssessmentAnswerRequest {
  answerId: number;
  assessmentQuestionId: number;
  attemptsId: number;
  selectedOptionId: string; // Guid of QuestionOption
}

// Assignment Attempt Types
export interface AssignmentAttemptDto {
  attemptsId: number;
  assessmentId: number;
  userId: string;
  startedAt?: string;
  completedAt?: string;
  attemptNumber: number;
  updatedAt?: string;
}

export interface CreateAssignmentAttemptRequest {
  assessmentId: number;
  userId: string;
  completedAt?: string; // ISO 8601 format
  attemptNumber: number;
}

export interface UpdateAssignmentAttemptRequest {
  attemptsId: number;
  assessmentId: number;
  userId: string;
  startedAt?: string;
  completedAt?: string;
  attemptNumber: number;
}

export interface InviteUserToAssignmentAttemptRequest {
  userEmail: string;
  assignmentAttemptId: number;
}

// Grading Feedback Types
export interface GradingFeedbackDto {
  feedbackId: number;
  attemptsId: number;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  correctPercentage: number;
  wrongPercentage: number;
  grade: string;
  performance: string; // General performance evaluation
  createdAt?: string;
  updatedAt?: string;
}

export interface CalculateGradingRequest {
  attemptId: number;
}

export interface CalculateGradingResponse {
  feedbackId: number;
  attemptsId: number;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  correctPercentage: number;
  wrongPercentage: number;
  grade: string;
  createdAt: string;
}

// ============================================================================
// Assessment APIs
// ============================================================================

/**
 * Get all assessments
 * @returns ObjectResponse with array of AssessmentDto
 */
export const getAllAssessments = async (): Promise<
  ObjectResponse<AssessmentDto[]>
> => {
  try {
    const response =
      await BaseRequest.Get<ObjectResponse<AssessmentDto[]>>(
        '/api/v1/assessment'
      );
    return response;
  } catch (error) {
    console.error('Get All Assessments Error:', error);
    throw error;
  }
};

/**
 * Get assessment by ID
 * @param assessmentId - Assessment ID to fetch
 * @returns ObjectResponse with AssessmentDto
 */
export const getAssessmentById = async (
  assessmentId: number
): Promise<ObjectResponse<AssessmentDto>> => {
  try {
    const response = await BaseRequest.Get<ObjectResponse<AssessmentDto>>(
      `/api/v1/assessment/${assessmentId}`
    );
    return response;
  } catch (error) {
    console.error('Get Assessment By ID Error:', error);
    throw error;
  }
};

/**
 * Create a new assessment
 * @param data - Assessment data to create
 * @returns ObjectResponse with created assessment ID (int)
 */
export const createAssessment = async (
  data: CreateAssessmentRequest
): Promise<ObjectResponse<number>> => {
  try {
    const response = await BaseRequest.Post<ObjectResponse<number>>(
      '/api/v1/assessment',
      data
    );
    return response;
  } catch (error) {
    console.error('Create Assessment Error:', error);
    throw error;
  }
};

/**
 * Update an existing assessment
 * @param assessmentId - Assessment ID to update
 * @param data - Assessment data to update
 * @returns ObjectResponse with boolean result
 */
export const updateAssessment = async (
  assessmentId: number,
  data: UpdateAssessmentRequest
): Promise<ObjectResponse<boolean>> => {
  try {
    const response = await BaseRequest.Put<ObjectResponse<boolean>>(
      `/api/v1/assessment/${assessmentId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Update Assessment Error:', error);
    throw error;
  }
};

/**
 * Delete an assessment
 * @param assessmentId - Assessment ID to delete
 * @returns ObjectResponse with boolean result
 */
export const deleteAssessment = async (
  assessmentId: number
): Promise<ObjectResponse<boolean>> => {
  try {
    const response = (await BaseRequest.Delete<ObjectResponse<boolean>>(
      `/api/v1/assessment/${assessmentId}`
    )) as ObjectResponse<boolean>;
    return response;
  } catch (error) {
    console.error('Delete Assessment Error:', error);
    throw error;
  }
};

// ============================================================================
// Assessment Question APIs
// ============================================================================

/**
 * Get all assessment questions
 * @returns ObjectResponse with array of AssessmentQuestionDto
 */
export const getAllAssessmentQuestions = async (): Promise<
  ObjectResponse<AssessmentQuestionDto[]>
> => {
  try {
    const response = await BaseRequest.Get<
      ObjectResponse<AssessmentQuestionDto[]>
    >('/api/v1/assessmentquestion');
    return response;
  } catch (error) {
    console.error('Get All Assessment Questions Error:', error);
    throw error;
  }
};

/**
 * Get assessment question by ID
 * @param assessmentQuestionId - Assessment Question ID to fetch
 * @returns ObjectResponse with AssessmentQuestionDto
 */
export const getAssessmentQuestionById = async (
  assessmentQuestionId: number
): Promise<ObjectResponse<AssessmentQuestionDto>> => {
  try {
    const response = await BaseRequest.Get<
      ObjectResponse<AssessmentQuestionDto>
    >(`/api/v1/assessmentquestion/${assessmentQuestionId}`);
    return response;
  } catch (error) {
    console.error('Get Assessment Question By ID Error:', error);
    throw error;
  }
};

/**
 * Get assessment questions by Assessment ID
 * @param assessmentId - Assessment ID
 * @returns ObjectResponse with array of AssessmentQuestionDto
 */
export const getAssessmentQuestionsByAssessmentId = async (
  assessmentId: number
): Promise<ObjectResponse<AssessmentQuestionDto[]>> => {
  try {
    const response = await BaseRequest.Get<
      ObjectResponse<AssessmentQuestionDto[]>
    >(`/api/v1/assessmentquestion/assessment/${assessmentId}`);
    return response;
  } catch (error) {
    console.error('Get Assessment Questions By Assessment ID Error:', error);
    throw error;
  }
};

/**
 * Create a new assessment question
 * @param data - Assessment Question data to create
 * @returns ObjectResponse with created assessment question ID (int)
 */
export const createAssessmentQuestion = async (
  data: CreateAssessmentQuestionRequest
): Promise<ObjectResponse<number>> => {
  try {
    const response = await BaseRequest.Post<ObjectResponse<number>>(
      '/api/v1/assessmentquestion',
      data
    );
    return response;
  } catch (error) {
    console.error('Create Assessment Question Error:', error);
    throw error;
  }
};

/**
 * Update an existing assessment question
 * @param assessmentQuestionId - Assessment Question ID to update
 * @param data - Assessment Question data to update
 * @returns ObjectResponse with boolean result
 */
export const updateAssessmentQuestion = async (
  assessmentQuestionId: number,
  data: UpdateAssessmentQuestionRequest
): Promise<ObjectResponse<boolean>> => {
  try {
    const response = await BaseRequest.Put<ObjectResponse<boolean>>(
      `/api/v1/assessmentquestion/${assessmentQuestionId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Update Assessment Question Error:', error);
    throw error;
  }
};

/**
 * Create multiple assessment questions (bulk create)
 * @param data - Assessment Questions data to create
 * @returns ObjectResponse with array of created assessment question IDs
 */
export const createAssessmentQuestions = async (
  data: CreateAssessmentQuestionsRequest
): Promise<ObjectResponse<number[]>> => {
  try {
    const response = await BaseRequest.Post<ObjectResponse<number[]>>(
      '/api/v1/assessmentquestion/bulk',
      data
    );
    return response;
  } catch (error) {
    console.error('Create Assessment Questions (Bulk) Error:', error);
    throw error;
  }
};

/**
 * Delete an assessment question
 * @param assessmentQuestionId - Assessment Question ID to delete
 * @returns ObjectResponse with boolean result
 */
export const deleteAssessmentQuestion = async (
  assessmentQuestionId: number
): Promise<ObjectResponse<boolean>> => {
  try {
    const response = (await BaseRequest.Delete<ObjectResponse<boolean>>(
      `/api/v1/assessmentquestion/${assessmentQuestionId}`
    )) as ObjectResponse<boolean>;
    return response;
  } catch (error) {
    console.error('Delete Assessment Question Error:', error);
    throw error;
  }
};

// ============================================================================
// Assessment Answer APIs
// ============================================================================

/**
 * Get all assessment answers
 * @returns Array of AssessmentAnswerDto (Note: This endpoint returns direct array, not ObjectResponse)
 */
export const getAllAssessmentAnswers = async (): Promise<
  AssessmentAnswerDto[]
> => {
  try {
    const response = await BaseRequest.Get<AssessmentAnswerDto[]>(
      '/api/v1/assessmentanswer'
    );
    return response;
  } catch (error) {
    console.error('Get All Assessment Answers Error:', error);
    throw error;
  }
};

/**
 * Get assessment answer by ID
 * @param answerId - Answer ID to fetch
 * @returns AssessmentAnswerDto (Note: This endpoint returns direct object, not ObjectResponse)
 */
export const getAssessmentAnswerById = async (
  answerId: number
): Promise<AssessmentAnswerDto> => {
  try {
    const response = await BaseRequest.Get<AssessmentAnswerDto>(
      `/api/v1/assessmentanswer/${answerId}`
    );
    return response;
  } catch (error) {
    console.error('Get Assessment Answer By ID Error:', error);
    throw error;
  }
};

/**
 * Get assessment answers by Attempt ID
 * @param attemptId - Attempt ID
 * @returns Array of AssessmentAnswerDto (Note: This endpoint returns direct array, not ObjectResponse)
 */
export const getAssessmentAnswersByAttemptId = async (
  attemptId: number
): Promise<AssessmentAnswerDto[]> => {
  try {
    const response = await BaseRequest.Get<AssessmentAnswerDto[]>(
      `/api/v1/assessmentanswer/attempt/${attemptId}`
    );
    // Ensure response is always an array
    if (Array.isArray(response)) {
      return response;
    }
    // If response is null, undefined, or not an array, return empty array
    return [];
  } catch (error) {
    console.error('Get Assessment Answers By Attempt ID Error:', error);
    // Return empty array instead of throwing error when no answers exist
    return [];
  }
};

/**
 * Create a new assessment answer
 * @param data - Assessment Answer data to create
 * @returns Created assessment answer ID (int) (Note: This endpoint returns direct number, not ObjectResponse)
 */
export const createAssessmentAnswer = async (
  data: CreateAssessmentAnswerRequest
): Promise<number> => {
  try {
    // Backend expects ObjectResponse<int>
    const response = await BaseRequest.Post<ObjectResponse<number>>(
      '/api/v1/assessmentanswer',
      {
        assessmentQuestionId: data.assessmentQuestionId,
        attemptsId: data.attemptsId,
        selectedOptionId: data.selectedOptionId
      }
    );
    return response.data || response.Data || 0;
  } catch (error) {
    console.error('Create Assessment Answer Error:', error);
    throw error;
  }
};

/**
 * Update an existing assessment answer
 * @param answerId - Answer ID to update
 * @param data - Assessment Answer data to update
 * @returns Boolean result (Note: This endpoint returns ObjectResponse<bool>)
 */
export const updateAssessmentAnswer = async (
  answerId: number,
  data: UpdateAssessmentAnswerRequest
): Promise<boolean> => {
  try {
    const response = await BaseRequest.Put<ObjectResponse<boolean>>(
      `/api/v1/assessmentanswer/${answerId}`,
      {
        answerId: data.answerId,
        assessmentQuestionId: data.assessmentQuestionId,
        attemptsId: data.attemptsId,
        selectedOptionId: data.selectedOptionId
      }
    );
    return response.data || response.Data || false;
  } catch (error) {
    console.error('Update Assessment Answer Error:', error);
    throw error;
  }
};

/**
 * Delete an assessment answer
 * @param answerId - Answer ID to delete
 * @returns Boolean result (Backend returns ObjectResponse<bool>)
 */
export const deleteAssessmentAnswer = async (
  answerId: number
): Promise<boolean> => {
  try {
    const response = await BaseRequest.Delete<ObjectResponse<boolean>>(
      `/api/v1/assessmentanswer/${answerId}`
    );
    // Backend returns ObjectResponse<bool>, extract the data
    return response.data || response.Data || false;
  } catch (error) {
    console.error('Delete Assessment Answer Error:', error);
    throw error;
  }
};

// ============================================================================
// Assignment Attempt APIs
// ============================================================================

/**
 * Get all assignment attempts
 * @returns ObjectResponse with array of AssignmentAttemptDto
 */
export const getAllAssignmentAttempts = async (): Promise<
  ObjectResponse<AssignmentAttemptDto[]>
> => {
  try {
    const response = await BaseRequest.Get<
      ObjectResponse<AssignmentAttemptDto[]>
    >('/api/v1/assignmentattempt');
    return response;
  } catch (error) {
    console.error('Get All Assignment Attempts Error:', error);
    throw error;
  }
};

/**
 * Get assignment attempt by ID
 * @param attemptId - Attempt ID to fetch
 * @returns ObjectResponse with AssignmentAttemptDto
 */
export const getAssignmentAttemptById = async (
  attemptId: number
): Promise<ObjectResponse<AssignmentAttemptDto>> => {
  try {
    const response = await BaseRequest.Get<
      ObjectResponse<AssignmentAttemptDto>
    >(`/api/v1/assignmentattempt/${attemptId}`);
    return response;
  } catch (error) {
    console.error('Get Assignment Attempt By ID Error:', error);
    throw error;
  }
};

/**
 * Get assignment attempts by Assessment ID
 * NOTE: This endpoint is not available in backend yet. Using getAllAssignmentAttempts and filtering on frontend as temporary workaround.
 * @param assessmentId - Assessment ID
 * @returns ObjectResponse with array of AssignmentAttemptDto
 */
export const getAssignmentAttemptsByAssessmentId = async (
  assessmentId: number
): Promise<ObjectResponse<AssignmentAttemptDto[]>> => {
  try {
    // Temporary workaround: Get all attempts and filter by assessmentId on frontend
    // TODO: Replace with proper endpoint when backend adds GET /api/v1/assignmentattempt/assessment/{assessmentId}
    const allAttemptsResponse = await getAllAssignmentAttempts();
    const allAttempts = (allAttemptsResponse.data ||
      []) as AssignmentAttemptDto[];
    const filteredAttempts = allAttempts.filter(
      (attempt) => attempt.assessmentId === assessmentId
    );

    return {
      errorCode: allAttemptsResponse.errorCode || '200',
      message: allAttemptsResponse.message || 'Success',
      data: filteredAttempts
    };
  } catch (error) {
    console.error('Get Assignment Attempts By Assessment ID Error:', error);
    // Return empty array instead of throwing error
    return {
      errorCode: '500',
      message: 'Failed to fetch assignment attempts',
      data: []
    };
  }
};

/**
 * Create a new assignment attempt
 * @param data - Assignment Attempt data to create
 * @returns ObjectResponse with created attempt ID (int)
 */
export const createAssignmentAttempt = async (
  data: CreateAssignmentAttemptRequest
): Promise<ObjectResponse<number>> => {
  try {
    const response = await BaseRequest.Post<ObjectResponse<number>>(
      '/api/v1/assignmentattempt',
      data
    );
    return response;
  } catch (error) {
    console.error('Create Assignment Attempt Error:', error);
    throw error;
  }
};

/**
 * Update an existing assignment attempt
 * @param attemptId - Attempt ID to update
 * @param data - Assignment Attempt data to update
 * @returns ObjectResponse with boolean result
 */
export const updateAssignmentAttempt = async (
  attemptId: number,
  data: UpdateAssignmentAttemptRequest
): Promise<ObjectResponse<boolean>> => {
  try {
    const response = await BaseRequest.Put<ObjectResponse<boolean>>(
      `/api/v1/assignmentattempt/${attemptId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Update Assignment Attempt Error:', error);
    throw error;
  }
};

/**
 * Delete an assignment attempt
 * @param attemptId - Attempt ID to delete
 * @returns ObjectResponse with boolean result
 */
export const deleteAssignmentAttempt = async (
  attemptId: number
): Promise<ObjectResponse<boolean>> => {
  try {
    const response = (await BaseRequest.Delete<ObjectResponse<boolean>>(
      `/api/v1/assignmentattempt/${attemptId}`
    )) as ObjectResponse<boolean>;
    return response;
  } catch (error) {
    console.error('Delete Assignment Attempt Error:', error);
    throw error;
  }
};

/**
 * Invite user to assignment attempt
 * @param data - Invite data
 * @returns ObjectResponse with boolean result
 */
export const inviteUserToAssignmentAttempt = async (
  data: InviteUserToAssignmentAttemptRequest
): Promise<ObjectResponse<boolean>> => {
  try {
    const response = await BaseRequest.Post<ObjectResponse<boolean>>(
      '/api/v1/assignmentattempt/invite',
      data
    );
    return response;
  } catch (error) {
    console.error('Invite User To Assignment Attempt Error:', error);
    throw error;
  }
};

// ============================================================================
// Grading Feedback APIs
// ============================================================================

/**
 * Calculate grading for an attempt
 * @param data - Calculate grading request
 * @returns ObjectResponse with CalculateGradingResponse
 */
export const calculateGrading = async (
  data: CalculateGradingRequest
): Promise<ObjectResponse<CalculateGradingResponse>> => {
  try {
    const response = await BaseRequest.Post<
      ObjectResponse<CalculateGradingResponse>
    >('/api/v1/gradingfeedback/calculate', data);
    return response;
  } catch (error) {
    console.error('Calculate Grading Error:', error);
    throw error;
  }
};

/**
 * Get grading feedback by ID
 * @param feedbackId - Feedback ID to fetch
 * @returns ObjectResponse with GradingFeedbackDto
 */
export const getGradingFeedback = async (
  feedbackId: number
): Promise<ObjectResponse<GradingFeedbackDto>> => {
  try {
    const response = await BaseRequest.Get<ObjectResponse<GradingFeedbackDto>>(
      `/api/v1/gradingfeedback/${feedbackId}`
    );
    return response;
  } catch (error) {
    console.error('Get Grading Feedback Error:', error);
    throw error;
  }
};
