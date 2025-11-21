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
 * Get all courses
 * Backend: GET /api/v1/courses (query service)
 * Returns: ApiResponse<List<CourseDto>>
 * @returns ApiResponse with array of CourseDto
 */
export const getAllCourses = async (): Promise<ApiResponse<CourseDto[]>> => {
  try {
    console.log('[getAllCourses] Starting API call to /api/v1/courses');
    const response =
      await BaseRequest.Get<ApiResponse<CourseDto[]>>('/api/v1/courses');

    console.log('[getAllCourses] Raw API response:', response);
    console.log('[getAllCourses] Response type:', typeof response);
    console.log('[getAllCourses] Response.data type:', typeof response?.data);
    console.log(
      '[getAllCourses] Is response.data an array?',
      Array.isArray(response?.data)
    );
    console.log('[getAllCourses] Response.data:', response?.data);

    // Handle response - backend returns ApiResponse<List<CourseDto>>
    // Check if response.data is an array (Query Service returns array directly)
    if (Array.isArray(response?.data)) {
      console.log(
        '[getAllCourses] Processing array of',
        response.data.length,
        'items'
      );

      // Map backend DTO to frontend DTO format
      const mappedItems = response.data
        .map((item: any, index: number) => {
          console.log(`[getAllCourses] Processing item ${index}:`, item);

          // Backend returns CourseDto with CourseId (Guid as string), map to frontend format
          const courseDto: CourseDto = {
            id: item.courseId || item.CourseId || item.id || '',
            syllabusId: item.syllabusId || item.SyllabusId || '',
            courseCode: item.courseCode || item.CourseCode || '',
            title: item.title || item.Title || '',
            description: item.description || item.Description || '',
            createdAt: item.createdAt || item.CreatedAt,
            updatedAt: item.updatedAt || item.UpdatedAt
          };

          console.log(`[getAllCourses] Item ${index} mapped:`, courseDto);
          return courseDto;
        })
        .filter((course: CourseDto, index: number) => {
          const isValid =
            course.id &&
            typeof course.id === 'string' &&
            course.id.trim() !== '';
          if (!isValid) {
            console.log(
              `[getAllCourses] Filtered out item ${index} - invalid ID:`,
              course
            );
          }
          return isValid;
        });

      console.log('[getAllCourses] Final mapped items:', mappedItems);
      console.log(
        '[getAllCourses] Returning',
        mappedItems.length,
        'valid courses'
      );

      return {
        success: response.success ?? true,
        message: response.message || 'Courses fetched successfully',
        data: mappedItems
      } as ApiResponse<CourseDto[]>;
    }

    console.log(
      '[getAllCourses] Response.data is not an array, returning empty array'
    );
    console.log(
      '[getAllCourses] Response structure:',
      JSON.stringify(response, null, 2)
    );

    return {
      success: response.success ?? true,
      message: response.message || 'No courses found',
      data: []
    } as ApiResponse<CourseDto[]>;
  } catch (error) {
    console.error('[getAllCourses] Error occurred:', error);
    console.error('[getAllCourses] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
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
 * Backend: DELETE /api/v1/course/{id} (write service - singular "course")
 * Returns: ApiResponse<object> - Success message (not boolean)
 * @param courseId - Course ID to delete (Guid as string)
 * @returns ApiResponse with object (success message)
 */
export const deleteCourse = async (
  courseId: string
): Promise<ApiResponse<object>> => {
  try {
    const response = await BaseRequest.Delete<ApiResponse<object>>(
      `/api/v1/courses/${courseId}`
    );
    return response;
  } catch (error) {
    console.error('Delete Course Error:', error);
    throw error;
  }
};
