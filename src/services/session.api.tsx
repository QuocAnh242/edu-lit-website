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

// Session DTOs
export interface SessionDto {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  position: number;
  durationMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Request Types
export interface GetPaginationSessionsRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  courseId?: string;
}

export interface CreateSessionRequest {
  courseId: string;
  title: string;
  description?: string;
  position: number;
  durationMinutes?: number;
}

export interface UpdateSessionRequest {
  title?: string;
  description?: string;
  position?: number;
  durationMinutes?: number;
}

// ============================================================================
// Session APIs
// ============================================================================

/**
 * Get all sessions with pagination
 * @param request - Pagination and filter parameters
 * @returns ApiResponse with PagedResult of SessionDto
 */
export const getAllSessions = async (
  request?: GetPaginationSessionsRequest
): Promise<ApiResponse<PagedResult<SessionDto>>> => {
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
    if (request?.courseId) {
      params.append('courseId', request.courseId);
    }

    const queryString = params.toString();
    const url = `/api/v1/session${queryString ? `?${queryString}` : ''}`;

    const response =
      await BaseRequest.Get<ApiResponse<PagedResult<SessionDto>>>(url);
    return response;
  } catch (error) {
    console.error('Get All Sessions Error:', error);
    throw error;
  }
};

/**
 * Get session by ID
 * @param sessionId - Session ID to fetch (Guid as string)
 * @returns ApiResponse with SessionDto
 */
export const getSessionById = async (
  sessionId: string
): Promise<ApiResponse<SessionDto>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<SessionDto>>(
      `/api/v1/session/${sessionId}`
    );
    return response;
  } catch (error) {
    console.error('Get Session By ID Error:', error);
    throw error;
  }
};

/**
 * Create a new session
 * @param data - Session data to create
 * @returns ApiResponse with created session ID (Guid as string)
 */
export const createSession = async (
  data: CreateSessionRequest
): Promise<ApiResponse<string>> => {
  try {
    const response = await BaseRequest.Post<ApiResponse<string>>(
      '/api/v1/session',
      data
    );
    return response;
  } catch (error) {
    console.error('Create Session Error:', error);
    throw error;
  }
};

/**
 * Update an existing session
 * @param sessionId - Session ID to update (Guid as string)
 * @param data - Session data to update
 * @returns ApiResponse with boolean result
 */
export const updateSession = async (
  sessionId: string,
  data: UpdateSessionRequest
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await BaseRequest.Put<ApiResponse<boolean>>(
      `/api/v1/session/${sessionId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Update Session Error:', error);
    throw error;
  }
};

/**
 * Delete a session
 * @param sessionId - Session ID to delete (Guid as string)
 * @returns ApiResponse with boolean result
 */
export const deleteSession = async (
  sessionId: string
): Promise<ApiResponse<boolean>> => {
  try {
    const response = (await BaseRequest.Delete<ApiResponse<boolean>>(
      `/api/v1/session/${sessionId}`
    )) as ApiResponse<boolean>;
    return response;
  } catch (error) {
    console.error('Delete Session Error:', error);
    throw error;
  }
};
