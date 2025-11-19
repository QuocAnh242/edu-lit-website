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
 * NOTE: This endpoint does not exist in the backend.
 * The backend only has:
 * - GET /api/v1/courses/{id} - Get course by ID (query service)
 * - GET /api/v1/courses/by-syllabus/{syllabusId} - Get courses by syllabus ID (query service)
 *
 * This function is kept for backward compatibility but will fail.
 * Use getCoursesBySyllabusId() or aggregate courses from all syllabuses instead.
 * @param request - Pagination and filter parameters
 * @returns ApiResponse with PagedResult of CourseDto
 * @deprecated This endpoint doesn't exist. Use getCoursesBySyllabusId() instead.
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
 * Backend: GET /api/v1/courses/{id} (query service - plural "courses")
 * @param courseId - Course ID to fetch (Guid as string)
 * @returns ApiResponse with CourseDto
 */
export const getCourseById = async (
  courseId: string
): Promise<ApiResponse<CourseDto>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<CourseDto>>(
      `/api/v1/courses/${courseId}`
    );
    return response;
  } catch (error) {
    console.error('Get Course By ID Error:', error);
    throw error;
  }
};

/**
 * Get courses by Syllabus ID
 * Backend: GET /api/v1/courses/by-syllabus/{syllabusId} (query service - plural "courses")
 * @param syllabusId - Syllabus ID to fetch courses for (Guid as string)
 * @returns ApiResponse with array of CourseDto
 */
export const getCoursesBySyllabusId = async (
  syllabusId: string
): Promise<ApiResponse<CourseDto[]>> => {
  try {
    const response = await BaseRequest.Get<ApiResponse<CourseDto[]>>(
      `/api/v1/courses/by-syllabus/${syllabusId}`
    );
    return response;
  } catch (error) {
    console.error('Get Courses By Syllabus ID Error:', error);
    throw error;
  }
};

/**
 * Create a new course
 * Backend: POST /api/v1/course (write service - singular "course")
 * Returns: ApiResponse<Guid> - The created course ID
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
 * Backend: PUT /api/v1/course/{id} (write service - singular "course")
 * Returns: ApiResponse<object> - Success message (not boolean)
 * @param courseId - Course ID to update (Guid as string)
 * @param data - Course data to update
 * @returns ApiResponse with object (success message)
 */
export const updateCourse = async (
  courseId: string,
  data: UpdateCourseRequest
): Promise<ApiResponse<object>> => {
  try {
    const response = await BaseRequest.Put<ApiResponse<object>>(
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
 * Backend: DELETE /api/v1/course/{id} (write service - singular "course")
 * Returns: ApiResponse<object> - Success message (not boolean)
 * @param courseId - Course ID to delete (Guid as string)
 * @returns ApiResponse with object (success message)
 */
export const deleteCourse = async (
  courseId: string
): Promise<ApiResponse<object>> => {
  try {
    const response = (await BaseRequest.Delete<ApiResponse<object>>(
      `/api/v1/course/${courseId}`
    )) as ApiResponse<object>;
    return response;
  } catch (error) {
    console.error('Delete Course Error:', error);
    throw error;
  }
};
