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

// Course DTOs
export interface CourseDto {
  id: string;
  syllabusId: string;
  courseCode: string;
  title: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Request Types
export interface GetPaginationCoursesRequest {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  syllabusId?: string;
}

export interface CreateCourseRequest {
  syllabusId: string;
  courseCode: string;
  title: string;
  description?: string;
}

export interface UpdateCourseRequest {
  syllabusId: string;
  courseCode: string;
  title: string;
  description?: string;
}

// ============================================================================
// Course APIs
// ============================================================================

/**
 * Get all courses with pagination
 * @param request - Pagination and filter parameters
 * @returns ApiResponse with PagedResult of CourseDto
 */
export const getAllCourses = async (
  request?: GetPaginationCoursesRequest
): Promise<ApiResponse<PagedResult<CourseDto>>> => {
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
    if (request?.syllabusId) {
      params.append('syllabusId', request.syllabusId);
    }

    const queryString = params.toString();
    const url = `/api/v1/course${queryString ? `?${queryString}` : ''}`;

    const response =
      await BaseRequest.Get<ApiResponse<PagedResult<CourseDto>>>(url);
    return response;
  } catch (error) {
    console.error('Get All Courses Error:', error);
    throw error;
  }
};

/**
 * Get course by ID
 * @param courseId - Course ID to fetch (Guid as string)
 * @returns ApiResponse with CourseDto
 */
export const getCourseById = async (
  courseId: string
): Promise<ApiResponse<CourseDto>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<CourseDto>>(
      `/api/v1/course/${courseId}`
    );
    return response;
  } catch (error) {
    console.error('Get Course By ID Error:', error);
    throw error;
  }
};

/**
 * Create a new course
 * @param data - Course data to create
 * @returns ApiResponse with created course ID (Guid as string)
 */
export const createCourse = async (
  data: CreateCourseRequest
): Promise<ApiResponse<string>> => {
  try {
    const response = await BaseRequest.Post<ApiResponse<string>>(
      '/api/v1/course',
      data
    );
    return response;
  } catch (error) {
    console.error('Create Course Error:', error);
    throw error;
  }
};

/**
 * Update an existing course
 * @param courseId - Course ID to update (Guid as string)
 * @param data - Course data to update
 * @returns ApiResponse with boolean result
 */
export const updateCourse = async (
  courseId: string,
  data: UpdateCourseRequest
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await BaseRequest.Put<ApiResponse<boolean>>(
      `/api/v1/course/${courseId}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Update Course Error:', error);
    throw error;
  }
};

/**
 * Delete a course
 * @param courseId - Course ID to delete (Guid as string)
 * @returns ApiResponse with boolean result
 */
export const deleteCourse = async (
  courseId: string
): Promise<ApiResponse<boolean>> => {
  try {
    const response = (await BaseRequest.Delete<ApiResponse<boolean>>(
      `/api/v1/course/${courseId}`
    )) as ApiResponse<boolean>;
    return response;
  } catch (error) {
    console.error('Delete Course Error:', error);
    throw error;
  }
};
