import BaseRequest from '@/config/axios.config';

// ============================================================================
// Types
// ============================================================================

// API Response Types (from LessonService - ApiResponse structure)
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  statusCode?: number;
  errors?: string[];
  errorCode?: string | null;
}

// PagedResult structure from backend
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// LessonContext DTOs
export interface LessonContextDto {
  id: string;
  sessionId: string;
  parentLessonId?: string | null;
  lessonTitle: string;
  lessonContent?: string | null;
  position: number;
  level?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// Request Types
export interface GetPaginationLessonContextsRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sessionId?: string;
  parentLessonId?: string;
}

export interface CreateLessonContextRequest {
  sessionId: string;
  parentLessonId?: string | null;
  lessonTitle: string;
  lessonContent?: string | null;
  position: number;
  level?: number | null;
}

export interface UpdateLessonContextRequest {
  lessonTitle?: string;
  lessonContent?: string | null;
  position?: number;
  level?: number | null;
}

// ============================================================================
// LessonContext APIs
// ============================================================================

/**
 * Get all lesson contexts with pagination
 * @param request - Pagination and filter parameters
 * @returns ApiResponse with PagedResult of LessonContextDto
 */
export const getAllLessonContexts = async (
  request?: GetPaginationLessonContextsRequest
): Promise<ApiResponse<PagedResult<LessonContextDto>>> => {
  try {
    const params = new URLSearchParams();
    if (request?.pageNumber) {
      params.append('pageNumber', request.pageNumber.toString());
    }
    if (request?.pageSize) {
      params.append('pageSize', request.pageSize.toString());
    }
    if (request?.searchTerm) {
      params.append('searchTerm', request.searchTerm);
    }
    if (request?.sessionId) {
      params.append('sessionId', request.sessionId);
    }
    if (request?.parentLessonId) {
      params.append('parentLessonId', request.parentLessonId);
    }

    const queryString = params.toString();
    const url = `/api/v1/lessoncontext${queryString ? `?${queryString}` : ''}`;

    const response =
      await BaseRequest.Get<ApiResponse<PagedResult<LessonContextDto>>>(url);
    return response;
  } catch (error) {
    console.error('Get All Lesson Contexts Error:', error);
    throw error;
  }
};

/**
 * Get lesson context by ID
 * @param lessonContextId - Lesson Context ID to fetch (Guid as string)
 * @returns ApiResponse with LessonContextDto
 */
export const getLessonContextById = async (
  lessonContextId: string
): Promise<ApiResponse<LessonContextDto>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<LessonContextDto>>(
      `/api/v1/lessoncontext/${lessonContextId}`
    );
    return response;
  } catch (error) {
    console.error('Get Lesson Context By ID Error:', error);
    throw error;
  }
};

/**
 * Create a new lesson context
 * @param data - Lesson context data to create
 * @returns ApiResponse with created lesson context ID (Guid as string)
 */
export const createLessonContext = async (
  data: CreateLessonContextRequest
): Promise<ApiResponse<string>> => {
  try {
    const response = await BaseRequest.Post<ApiResponse<string>>(
      '/api/v1/lessoncontext',
      data
    );
    return response;
  } catch (error) {
    console.error('Create Lesson Context Error:', error);
    throw error;
  }
};

/**
 * Update an existing lesson context
 * @param lessonContextId - Lesson Context ID to update (Guid as string)
 * @param data - Lesson context data to update
 * @returns ApiResponse with boolean result
 */
export const updateLessonContext = async (
  lessonContextId: string,
  data: UpdateLessonContextRequest
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await BaseRequest.Put<ApiResponse<boolean>>(
      `/api/v1/lessoncontext/${lessonContextId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Update Lesson Context Error:', error);
    throw error;
  }
};

/**
 * Delete a lesson context
 * @param lessonContextId - Lesson Context ID to delete (Guid as string)
 * @returns ApiResponse with boolean result
 */
export const deleteLessonContext = async (
  lessonContextId: string
): Promise<ApiResponse<boolean>> => {
  try {
    const response = (await BaseRequest.Delete<ApiResponse<boolean>>(
      `/api/v1/lessoncontext/${lessonContextId}`
    )) as ApiResponse<boolean>;
    return response;
  } catch (error) {
    console.error('Delete Lesson Context Error:', error);
    throw error;
  }
};
