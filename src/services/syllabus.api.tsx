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
 * Get all syllabuses with pagination
 * @param request - Pagination and filter parameters
 * @returns ApiResponse with PagedResult of SyllabusDto
 */
export const getAllSyllabuses = async (
  request?: GetPaginationSyllabusRequest
): Promise<ApiResponse<PagedResult<SyllabusDto>>> => {
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
    if (request?.semester !== undefined && request?.semester !== null) {
      params.append('semester', request.semester.toString());
    }
    if (request?.isActive !== undefined && request?.isActive !== null) {
      params.append('isActive', request.isActive.toString());
    }

    const queryString = params.toString();
    const url = `/api/v1/syllabus${queryString ? `?${queryString}` : ''}`;

    const response =
      await BaseRequest.Get<ApiResponse<PagedResult<SyllabusDto>>>(url);
    return response;
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
      `/api/v1/syllabus/${syllabusId}`
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
