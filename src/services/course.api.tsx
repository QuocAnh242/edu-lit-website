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

// MongoDB Response (from Query Service)
interface MongoCourseResponse {
  _id?: string;
  course_id?: any;
  syllabus_id?: any;
  title: string;
  description?: string;
  course_code?: string;
  order_index?: number;
  duration_weeks?: number;
  objectives?: any[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Course DTOs (Frontend format)
export interface CourseDto {
  id: string;
  syllabusId: string;
  courseCode: string;
  title: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to convert MongoDB Binary to string
const convertBinaryToString = (binary: any): string => {
  if (!binary) return '';
  if (typeof binary === 'string') return binary;
  if (binary.toString && typeof binary.toString === 'function') {
    return binary.toString();
  }
  return String(binary);
};

// Helper function to convert MongoDB response to CourseDto
const mapMongoCourseToDto = (mongo: MongoCourseResponse): CourseDto => {
  const id = mongo._id
    ? convertBinaryToString(mongo._id)
    : convertBinaryToString(mongo.course_id);
  const syllabusId = convertBinaryToString(mongo.syllabus_id);

  return {
    id: id,
    syllabusId: syllabusId,
    courseCode: mongo.course_code || '',
    title: mongo.title,
    description: mongo.description,
    createdAt: mongo.created_at,
    updatedAt: mongo.updated_at
  };
};

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
    const url = `/api/v1/courses${queryString ? `?${queryString}` : ''}`;

    const response = await BaseRequest.Get<ApiResponse<PagedResult<any>>>(url);

    // Check if response.data is an array (Query Service returns array directly)
    let rawItems: any[] = [];

    if (Array.isArray(response?.data)) {
      rawItems = response.data;
    } else if (response?.data?.items && Array.isArray(response.data.items)) {
      rawItems = response.data.items;
    }

    // Map MongoDB response to frontend DTO format
    if (rawItems.length > 0) {
      const mappedItems = rawItems.map((item: MongoCourseResponse) =>
        mapMongoCourseToDto(item)
      );

      return {
        success: true,
        message: response?.message || null,
        data: {
          items: mappedItems,
          totalCount: rawItems.length,
          pageNumber: request?.pageNumber || 1,
          pageSize: request?.pageSize || 1000,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false
        }
      } as ApiResponse<PagedResult<CourseDto>>;
    }

    // Return empty PagedResult
    return {
      success: true,
      message: response?.message || null,
      data: {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 1000,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false
      }
    } as ApiResponse<PagedResult<CourseDto>>;
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
      `/api/v1/courses/${courseId}`
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
      '/api/v1/courses',
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
      `/api/v1/courses/${courseId}`,
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
      `/api/v1/courses/${courseId}`
    )) as ApiResponse<boolean>;
    return response;
  } catch (error) {
    console.error('Delete Course Error:', error);
    throw error;
  }
};
