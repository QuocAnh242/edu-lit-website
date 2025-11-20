import BaseRequest from '@/config/axios.config';
import { QuestionBankDto } from '@/queries/question.query';

// ============================================================================
// Types
// ============================================================================

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
      '/api/v1/questionbank'
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
      `/api/v1/questionbank/${questionBankId}`
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
      `/api/v1/questionbank/owner/${ownerId}`
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
      `/api/v1/questionbank/subject/${encodeURIComponent(subject)}`
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
      '/api/v1/questionbank/my-question-banks'
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
      '/api/v1/questionbank',
      data
    );
    // Validate response structure
    if (!response) {
      throw new Error('No response received from server');
    }
    if (typeof response !== 'object') {
      throw new Error(`Invalid response type: ${typeof response}`);
    }
    // Ensure response has expected structure
    if (!('success' in response)) {
      throw new Error('Invalid response format: missing success property');
    }
    return response as ApiResponse<string>;
  } catch (error) {
    console.error('Create Question Bank Error:', error);
    // Re-throw with more context if needed
    if (error instanceof Error) {
      throw error;
    }
    // Handle case where error might be the response data
    if (error && typeof error === 'object' && 'message' in error) {
      throw error;
    }
    throw new Error('Failed to create question bank');
  }
};

/**
 * Update an existing question bank
 * @param questionBankId - QuestionBank ID to update
 * @param data - QuestionBank data to update (OwnerId is extracted from JWT token for backend)
 * @returns ApiResponse with updated question bank ID (Guid)
 */
export const updateQuestionBank = async (
  questionBankId: string,
  data: CreateQuestionBankRequest
): Promise<ApiResponse<string>> => {
  try {
    const response = await BaseRequest.Put<ApiResponse<string>>(
      `/api/v1/questionbank/${questionBankId}`,
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
      `/api/v1/questionbank/${questionBankId}`
    );
    // Axios interceptor extracts data, but TypeScript doesn't know this
    return response as unknown as ApiResponse<boolean>;
  } catch (error) {
    console.error('Delete Question Bank Error:', error);
    throw error;
  }
};
