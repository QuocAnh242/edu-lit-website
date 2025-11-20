import BaseRequest from '@/config/axios.config';
import {
  QuestionDto,
  QuestionBankDto,
  CreateQuestionRequest,
  CreateQuestionOptionRequest,
  QuestionType
} from '@/queries/question.query';

// ============================================================================
// Types
// ============================================================================

export interface QuestionOptionDto {
  questionOptionId: string;
  optionText: string;
  isCorrect: boolean;
  orderIdx: number;
  questionId: string;
}

export interface CreateQuestionBankRequest {
  title: string;
  description?: string;
  subject?: string;
}

export interface UpdateQuestionBankRequest {
  questionBankId: string;
  title: string;
  description?: string;
  subject?: string;
  ownerId: string;
}

export interface UpdateQuestionRequest {
  questionId: string;
  title: string;
  body: string;
  questionType: QuestionType;
  metadata?: string;
  tags?: string;
  version: number;
  isPublished: boolean;
  questionBankId: string;
  authorId: string;
}

export interface UpdateQuestionOptionRequest {
  questionOptionId: string;
  optionText: string;
  isCorrect: boolean;
  orderIdx: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  statusCode?: number;
  errors?: string[];
  errorCode?: string | null;
}

// ============================================================================
// Question APIs
// ============================================================================

/**
 * Get all questions
 * @returns ApiResponse with array of QuestionDto
 */
export const getAllQuestions = async (): Promise<
  ApiResponse<QuestionDto[]>
> => {
  try {
    const response =
      await BaseRequest.Get<ApiResponse<QuestionDto[]>>('/api/v1/question');
    return response;
  } catch (error) {
    console.error('Get All Questions Error:', error);
    throw error;
  }
};

/**
 * Get question by ID
 * @param questionId - Question ID to fetch
 * @returns ApiResponse with QuestionDto
 */
export const getQuestionById = async (
  questionId: string
): Promise<ApiResponse<QuestionDto>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<QuestionDto>>(
      `/api/v1/question/${questionId}`
    );
    return response;
  } catch (error) {
    console.error('Get Question By ID Error:', error);
    throw error;
  }
};

/**
 * Get questions by QuestionBank ID
 * @param questionBankId - QuestionBank ID
 * @returns ApiResponse with array of QuestionDto
 */
export const getQuestionsByQuestionBankId = async (
  questionBankId: string
): Promise<ApiResponse<QuestionDto[]>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<QuestionDto[]>>(
      `/api/v1/question/question-bank/${questionBankId}`
    );
    return response;
  } catch (error) {
    console.error('Get Questions By QuestionBank ID Error:', error);
    throw error;
  }
};

/**
 * Get questions by Author ID
 * @param authorId - Author ID
 * @returns ApiResponse with array of QuestionDto
 */
export const getQuestionsByAuthorId = async (
  authorId: string
): Promise<ApiResponse<QuestionDto[]>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<QuestionDto[]>>(
      `/api/v1/question/author/${authorId}`
    );
    return response;
  } catch (error) {
    console.error('Get Questions By Author ID Error:', error);
    throw error;
  }
};

/**
 * Get questions by type
 * @param questionType - QuestionType enum value (1 = Paragraph, 2 = Multichoice)
 * @returns ApiResponse with array of QuestionDto
 */
export const getQuestionsByType = async (
  questionType: QuestionType
): Promise<ApiResponse<QuestionDto[]>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<QuestionDto[]>>(
      `/api/v1/question/type/${questionType}`
    );
    return response;
  } catch (error) {
    console.error('Get Questions By Type Error:', error);
    throw error;
  }
};

/**
 * Get published questions
 * @returns ApiResponse with array of QuestionDto
 */
export const getPublishedQuestions = async (): Promise<
  ApiResponse<QuestionDto[]>
> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<QuestionDto[]>>(
      '/api/v1/question/published'
    );
    return response;
  } catch (error) {
    console.error('Get Published Questions Error:', error);
    throw error;
  }
};

/**
 * Get current user's questions (uses JWT token)
 * @returns ApiResponse with array of QuestionDto
 */
export const getMyQuestions = async (): Promise<ApiResponse<QuestionDto[]>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<QuestionDto[]>>(
      '/api/v1/question/my-questions'
    );
    return response;
  } catch (error) {
    console.error('Get My Questions Error:', error);
    throw error;
  }
};

/**
 * Create a new question
 * @param data - Question data to create
 * @returns ApiResponse with created question ID (Guid)
 */
export const createQuestion = async (
  data: CreateQuestionRequest
): Promise<ApiResponse<string>> => {
  try {
    const response = await BaseRequest.Post<ApiResponse<string>>(
      '/api/v1/question',
      data
    );
    return response;
  } catch (error) {
    console.error('Create Question Error:', error);
    throw error;
  }
};

/**
 * Update an existing question
 * @param questionId - Question ID to update
 * @param data - Question data to update
 * @returns ApiResponse with updated question ID (Guid)
 */
export const updateQuestion = async (
  questionId: string,
  data: UpdateQuestionRequest
): Promise<ApiResponse<string>> => {
  try {
    const response = await BaseRequest.Put<ApiResponse<string>>(
      `/api/v1/question/${questionId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Update Question Error:', error);
    throw error;
  }
};

/**
 * Delete a question
 * @param questionId - Question ID to delete
 * @returns ApiResponse with boolean result
 */
export const deleteQuestion = async (
  questionId: string
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await BaseRequest.Delete<ApiResponse<boolean>>(
      `/api/v1/question/${questionId}`
    );
    return response;
  } catch (error) {
    console.error('Delete Question Error:', error);
    throw error;
  }
};

// ============================================================================
// Question Bank APIs
// ============================================================================

/**
 * Get all question banks
 * @returns ApiResponse with array of QuestionBankDto
 */
export const getAllQuestionBanks = async (): Promise<
  ApiResponse<QuestionBankDto[]>
> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<QuestionBankDto[]>>(
      '/api/v1/QuestionBank'
    );
    return response;
  } catch (error) {
    console.error('Get All Question Banks Error:', error);
    throw error;
  }
};

/**
 * Get question bank by ID
 * @param questionBankId - QuestionBank ID to fetch
 * @returns ApiResponse with QuestionBankDto
 */
export const getQuestionBankById = async (
  questionBankId: string
): Promise<ApiResponse<QuestionBankDto>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<QuestionBankDto>>(
      `/api/v1/QuestionBank/${questionBankId}`
    );
    return response;
  } catch (error) {
    console.error('Get Question Bank By ID Error:', error);
    throw error;
  }
};

/**
 * Get question banks by Owner ID
 * @param ownerId - Owner ID
 * @returns ApiResponse with array of QuestionBankDto
 */
export const getQuestionBanksByOwnerId = async (
  ownerId: string
): Promise<ApiResponse<QuestionBankDto[]>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<QuestionBankDto[]>>(
      `/api/v1/QuestionBank/owner/${ownerId}`
    );
    return response;
  } catch (error) {
    console.error('Get Question Banks By Owner ID Error:', error);
    throw error;
  }
};

/**
 * Get question banks by subject
 * @param subject - Subject name
 * @returns ApiResponse with array of QuestionBankDto
 */
export const getQuestionBanksBySubject = async (
  subject: string
): Promise<ApiResponse<QuestionBankDto[]>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<QuestionBankDto[]>>(
      `/api/v1/QuestionBank/subject/${encodeURIComponent(subject)}`
    );
    return response;
  } catch (error) {
    console.error('Get Question Banks By Subject Error:', error);
    throw error;
  }
};

/**
 * Get current user's question banks (uses JWT token)
 * @returns ApiResponse with array of QuestionBankDto
 */
export const getMyQuestionBanks = async (): Promise<
  ApiResponse<QuestionBankDto[]>
> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<QuestionBankDto[]>>(
      '/api/v1/QuestionBank/my-question-banks'
    );
    return response;
  } catch (error) {
    console.error('Get My Question Banks Error:', error);
    throw error;
  }
};

/**
 * Create a new question bank
 * @param data - QuestionBank data to create (OwnerId is extracted from JWT token)
 * @returns ApiResponse with created question bank ID (Guid)
 */
export const createQuestionBank = async (
  data: CreateQuestionBankRequest
): Promise<ApiResponse<string>> => {
  try {
    const response = await BaseRequest.Post<ApiResponse<string>>(
      '/api/v1/QuestionBank',
      data
    );
    return response;
  } catch (error) {
    console.error('Create Question Bank Error:', error);
    throw error;
  }
};

/**
 * Update an existing question bank
 * @param questionBankId - QuestionBank ID to update
 * @param data - QuestionBank data to update
 * @returns ApiResponse with updated question bank ID (Guid)
 */
export const updateQuestionBank = async (
  questionBankId: string,
  data: UpdateQuestionBankRequest
): Promise<ApiResponse<string>> => {
  try {
    const response = await BaseRequest.Put<ApiResponse<string>>(
      `/api/v1/QuestionBank/${questionBankId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Update Question Bank Error:', error);
    throw error;
  }
};

/**
 * Delete a question bank
 * @param questionBankId - QuestionBank ID to delete
 * @returns ApiResponse with boolean result
 */
export const deleteQuestionBank = async (
  questionBankId: string
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await BaseRequest.Delete<ApiResponse<boolean>>(
      `/api/v1/QuestionBank/${questionBankId}`
    );
    return response;
  } catch (error) {
    console.error('Delete Question Bank Error:', error);
    throw error;
  }
};

// ============================================================================
// Question Option APIs
// ============================================================================

/**
 * Get question option by ID
 * @param questionOptionId - QuestionOption ID to fetch
 * @returns ApiResponse with QuestionOptionDto
 */
export const getQuestionOptionById = async (
  questionOptionId: string
): Promise<ApiResponse<QuestionOptionDto>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<QuestionOptionDto>>(
      `/api/v1/questionoption/${questionOptionId}`
    );
    return response;
  } catch (error) {
    console.error('Get Question Option By ID Error:', error);
    throw error;
  }
};

/**
 * Get question options by Question ID
 * @param questionId - Question ID
 * @returns ApiResponse with array of QuestionOptionDto
 */
export const getQuestionOptionsByQuestionId = async (
  questionId: string
): Promise<ApiResponse<QuestionOptionDto[]>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<QuestionOptionDto[]>>(
      `/api/v1/questionoption/question/${questionId}`
    );
    return response;
  } catch (error) {
    console.error('Get Question Options By Question ID Error:', error);
    throw error;
  }
};

/**
 * Create a new question option
 * @param data - QuestionOption data to create
 * @returns ApiResponse with created question option ID (Guid)
 */
export const createQuestionOption = async (
  data: CreateQuestionOptionRequest
): Promise<ApiResponse<string>> => {
  try {
    const response = await BaseRequest.Post<ApiResponse<string>>(
      '/api/v1/questionoption',
      data
    );
    return response;
  } catch (error) {
    console.error('Create Question Option Error:', error);
    throw error;
  }
};

/**
 * Update an existing question option
 * @param questionOptionId - QuestionOption ID to update
 * @param data - QuestionOption data to update
 * @returns ApiResponse with updated question option ID (Guid)
 */
export const updateQuestionOption = async (
  questionOptionId: string,
  data: UpdateQuestionOptionRequest
): Promise<ApiResponse<string>> => {
  try {
    const response = await BaseRequest.Put<ApiResponse<string>>(
      `/api/v1/questionoption/${questionOptionId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Update Question Option Error:', error);
    throw error;
  }
};

/**
 * Delete a question option
 * @param questionOptionId - QuestionOption ID to delete
 * @returns ApiResponse with boolean result
 */
export const deleteQuestionOption = async (
  questionOptionId: string
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await BaseRequest.Delete<ApiResponse<boolean>>(
      `/api/v1/questionoption/${questionOptionId}`
    );
    return response;
  } catch (error) {
    console.error('Delete Question Option Error:', error);
    throw error;
  }
};

/**
 * Delete all question options by Question ID
 * @param questionId - Question ID
 * @returns ApiResponse with boolean result
 */
export const deleteQuestionOptionsByQuestionId = async (
  questionId: string
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await BaseRequest.Delete<ApiResponse<boolean>>(
      `/api/v1/questionoption/question/${questionId}`
    );
    return response;
  } catch (error) {
    console.error('Delete Question Options By Question ID Error:', error);
    throw error;
  }
};
