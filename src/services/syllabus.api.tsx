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

// Semester enum (matches backend Semester enum)
export enum Semester {
  HocKiI = 0,
  HocKiII = 1,
  GiuaHocKiI = 2,
  GiuaHocKiII = 3,
  CuoiHocKiI = 4,
  CuoiHocKiII = 5
}

// Syllabus DTOs
export interface SyllabusDto {
  id: string;
  title: string;
  academicYear: string;
  semester: Semester;
  ownerId: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Request Types
export interface GetPaginationSyllabusRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  semester?: Semester;
  isActive?: boolean;
}

export interface CreateSyllabusRequest {
  title: string;
  academicYear: string;
  semester: Semester;
  description?: string;
}

export interface UpdateSyllabusRequest {
  title?: string;
  academicYear?: string;
  semester?: Semester;
  description?: string;
  isActive?: boolean;
}

// ============================================================================
// Syllabus APIs
// ============================================================================

/**
 * Get all syllabuses
 * NOTE: The API gateway routes /api/v1/syllabus to the write service which doesn't have a GET endpoint.
 * The query service has /api/v1/syllabuses but it's not routed through the gateway.
 * This function tries the query service endpoint first, then falls back gracefully.
 * @param request - Filter parameters (applied client-side)
 * @returns ApiResponse with array of SyllabusDto (wrapped in PagedResult for compatibility)
 */
export const getAllSyllabuses = async (
  request?: GetPaginationSyllabusRequest
): Promise<ApiResponse<PagedResult<SyllabusDto>>> => {
  try {
    // Try query service endpoint first (may not be routed through gateway)
    let url = `/api/v1/syllabuses`;
    let response: ApiResponse<SyllabusDto[]>;

    try {
      response = await BaseRequest.Get<ApiResponse<SyllabusDto[]>>(url);
    } catch (error: unknown) {
      // If query service endpoint fails (404), try write service endpoint
      // But write service doesn't have GET, so return empty result
      console.warn(
        'Query service endpoint not available, returning empty result'
      );
      return {
        success: true,
        message: 'Syllabuses endpoint not available through API gateway',
        data: {
          items: [],
          totalCount: 0,
          pageNumber: request?.pageNumber || 1,
          pageSize: request?.pageSize || 100,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false
        }
      };
    }

    // Transform the response to match the expected PagedResult format
    if (response.success && response.data) {
      let syllabuses = response.data;

      // Apply client-side filtering if needed
      if (request?.isActive !== undefined && request?.isActive !== null) {
        syllabuses = syllabuses.filter((s) => s.isActive === request.isActive);
      }
      if (request?.semester !== undefined && request?.semester !== null) {
        syllabuses = syllabuses.filter((s) => s.semester === request.semester);
      }
      if (request?.searchTerm) {
        const searchLower = request.searchTerm.toLowerCase();
        syllabuses = syllabuses.filter(
          (s) =>
            s.title.toLowerCase().includes(searchLower) ||
            s.academicYear.toLowerCase().includes(searchLower) ||
            s.description?.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination client-side
      const pageNumber = request?.pageNumber || 1;
      const pageSize = request?.pageSize || 100;
      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedItems = syllabuses.slice(startIndex, endIndex);

      return {
        ...response,
        data: {
          items: paginatedItems,
          totalCount: syllabuses.length,
          pageNumber: pageNumber,
          pageSize: pageSize,
          totalPages: Math.ceil(syllabuses.length / pageSize),
          hasPreviousPage: pageNumber > 1,
          hasNextPage: endIndex < syllabuses.length
        }
      };
    }

    // Return empty result if no data
    return {
      ...response,
      data: {
        items: [],
        totalCount: 0,
        pageNumber: request?.pageNumber || 1,
        pageSize: request?.pageSize || 100,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false
      }
    };
  } catch (error) {
    console.error('Get All Syllabuses Error:', error);
    throw error;
  }
};

/**
 * Get syllabus by ID
 * @param syllabusId - Syllabus ID to fetch (Guid as string)
 * @returns ApiResponse with SyllabusDto
 */
export const getSyllabusById = async (
  syllabusId: string
): Promise<ApiResponse<SyllabusDto>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<SyllabusDto>>(
      `/api/v1/syllabuses/${syllabusId}`
    );
    return response;
  } catch (error) {
    console.error('Get Syllabus By ID Error:', error);
    throw error;
  }
};

/**
 * Create a new syllabus
 * Note: The Author (OwnerId) is automatically extracted from the JWT token by the backend
 * @param data - Syllabus data to create
 * @returns ApiResponse with created syllabus ID (Guid as string)
 */
export const createSyllabus = async (
  data: CreateSyllabusRequest
): Promise<ApiResponse<string>> => {
  try {
    const response = await BaseRequest.Post<ApiResponse<string>>(
      '/api/v1/syllabus',
      data
    );
    return response;
  } catch (error) {
    console.error('Create Syllabus Error:', error);
    throw error;
  }
};

/**
 * Update an existing syllabus
 * @param syllabusId - Syllabus ID to update (Guid as string)
 * @param data - Syllabus data to update
 * @returns ApiResponse with boolean result
 */
export const updateSyllabus = async (
  syllabusId: string,
  data: UpdateSyllabusRequest
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await BaseRequest.Put<ApiResponse<boolean>>(
      `/api/v1/syllabus/${syllabusId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Update Syllabus Error:', error);
    throw error;
  }
};

/**
 * Delete a syllabus
 * @param syllabusId - Syllabus ID to delete (Guid as string)
 * @returns ApiResponse with boolean result
 */
export const deleteSyllabus = async (
  syllabusId: string
): Promise<ApiResponse<boolean>> => {
  try {
    const response = (await BaseRequest.Delete<ApiResponse<boolean>>(
      `/api/v1/syllabus/${syllabusId}`
    )) as ApiResponse<boolean>;
    return response;
  } catch (error) {
    console.error('Delete Syllabus Error:', error);
    throw error;
  }
};
