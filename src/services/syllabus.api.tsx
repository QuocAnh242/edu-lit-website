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

// MongoDB Response (from Query Service)
interface MongoSyllabusResponse {
  // MongoDB native fields (snake_case)
  _id?: string;
  syllabus_id?: string;
  title?: string;
  grade_level?: string; // Maps to academicYear
  subject?: string; // Maps to semester (as string)
  description?: string;
  status?: string; // Maps to isActive
  created_by?: string; // Maps to ownerId
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  version?: string;
  courses?: any[]; // Courses array from MongoDB

  // C# API serialized fields (camelCase - default JSON serialization)
  syllabusId?: string;
  gradeLevel?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;

  // C# API serialized fields (PascalCase - if configured)
  Title?: string;
  GradeLevel?: string;
  Subject?: string;
  Description?: string;
  Status?: string;
  CreatedBy?: string;
  IsActive?: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
  SyllabusId?: string;
}

// Syllabus DTOs (Frontend format)
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

// Helper function to map semester string to enum
const mapSemesterStringToEnum = (subject: string): Semester => {
  switch (subject) {
    case 'HocKiI':
      return Semester.HocKiI;
    case 'HocKiII':
      return Semester.HocKiII;
    case 'GiuaHocKiI':
      return Semester.GiuaHocKiI;
    case 'GiuaHocKiII':
      return Semester.GiuaHocKiII;
    case 'CuoiHocKiI':
      return Semester.CuoiHocKiI;
    case 'CuoiHocKiII':
      return Semester.CuoiHocKiII;
    default:
      return Semester.HocKiI; // Default fallback
  }
};

// Helper function to convert MongoDB Binary UUID to string
const convertBinaryToUuid = (binary: any): string => {
  if (!binary) return '';
  if (typeof binary === 'string') return binary;

  // If it's a MongoDB ObjectId, convert to string
  if (binary.toString && typeof binary.toString === 'function') {
    return binary.toString();
  }

  return String(binary);
};

// Helper function to convert MongoDB response to SyllabusDto
const mapMongoResponseToDto = (mongo: MongoSyllabusResponse): SyllabusDto => {
  // Handle camelCase (C# API default), snake_case (MongoDB), and PascalCase (C# custom)
  // IMPORTANT: Use syllabusId (SQL Server GUID) NOT _id (MongoDB ObjectId) for CRUD operations!
  const id = convertBinaryToUuid(
    mongo.syllabusId || mongo.syllabus_id || mongo.SyllabusId || mongo._id
  );

  const ownerId = convertBinaryToUuid(
    mongo.createdBy || mongo.created_by || mongo.CreatedBy
  );

  const title = mongo.title || mongo.Title || '';
  const gradeLevel =
    mongo.gradeLevel || mongo.grade_level || mongo.GradeLevel || '';
  const subject = mongo.subject || mongo.Subject || '';
  const description = mongo.description || mongo.Description || '';
  const status = mongo.status || mongo.Status || '';
  const isActive =
    status === 'Active' || mongo.is_active === true || mongo.IsActive === true;
  const createdAt = mongo.createdAt || mongo.created_at || mongo.CreatedAt;
  const updatedAt = mongo.updatedAt || mongo.updated_at || mongo.UpdatedAt;

  console.log('🔄 [MAPPING] MongoDB item:', {
    _id: mongo._id,
    syllabusId: mongo.syllabusId,
    mapped_id: id,
    title: title,
    gradeLevel: gradeLevel,
    subject: subject,
    status: status
  });

  const mapped = {
    id: id,
    title: title,
    academicYear: gradeLevel,
    semester: mapSemesterStringToEnum(subject),
    ownerId: ownerId,
    description: description,
    isActive: isActive,
    createdAt: createdAt,
    updatedAt: updatedAt,
    // Preserve courses array from MongoDB response
    courses: mongo.courses || []
  };

  console.log('✅ [MAPPING] Mapped result:', mapped);
  console.log(
    '📚 [MAPPING] Courses in mapped result:',
    mapped.courses?.length || 0
  );

  return mapped;
};

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
 * NOTE: The API gateway routes /api/v1/syllabus (GET) to the query service at /api/v1/syllabuses.
 * @param request - Filter parameters (applied client-side)
 * @returns ApiResponse with array of SyllabusDto (wrapped in PagedResult for compatibility)
 */
export const getAllSyllabuses = async (
  request?: GetPaginationSyllabusRequest
): Promise<ApiResponse<PagedResult<SyllabusDto>>> => {
  try {
    console.log('🔵 [GET SYLLABUSES API] Request params:', request);

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

    const url = `/api/v1/syllabus?${params.toString()}`;
    console.log('🔵 [GET SYLLABUSES API] URL:', url);
    console.log(
      '🔵 [GET SYLLABUSES API] Full URL:',
      `http://localhost:8000${url}`
    );

    const response = await BaseRequest.Get<ApiResponse<PagedResult<any>>>(url);

    console.log('🔵 [GET SYLLABUSES API] Raw response:', response);
    console.log('🔵 [GET SYLLABUSES API] Response success:', response?.success);
    console.log('🔵 [GET SYLLABUSES API] Response data:', response?.data);

    // Check if response.data is an array (Query Service returns array directly)
    // or if it's a PagedResult object with items property
    let rawItems: any[] = [];

    if (Array.isArray(response?.data)) {
      // Query Service returns array directly
      rawItems = response.data;
      console.log(
        '🔵 [GET SYLLABUSES API] Data is array (Query Service format)'
      );
    } else if (response?.data?.items && Array.isArray(response.data.items)) {
      // PagedResult format
      rawItems = response.data.items;
      console.log('🔵 [GET SYLLABUSES API] Data is PagedResult format');
    }

    console.log('🔵 [GET SYLLABUSES API] Items count:', rawItems.length);
    console.log(
      '🔵 [GET SYLLABUSES API] Raw items (MongoDB format):',
      rawItems
    );

    // Log first item details to check field names
    if (rawItems.length > 0) {
      console.log(
        '🔍 [GET SYLLABUSES API] First item keys:',
        Object.keys(rawItems[0])
      );
      console.log(
        '🔍 [GET SYLLABUSES API] First item full:',
        JSON.stringify(rawItems[0], null, 2)
      );
    }

    // Map MongoDB response to frontend DTO format
    if (rawItems.length > 0) {
      const mappedItems = rawItems.map((item: MongoSyllabusResponse) =>
        mapMongoResponseToDto(item)
      );
      console.log(
        '🔄 [GET SYLLABUSES API] Mapped items (Frontend format):',
        mappedItems
      );

      // Return in PagedResult format
      return {
        success: true,
        message: response?.message || null,
        data: {
          items: mappedItems,
          totalCount: rawItems.length,
          pageNumber: request?.pageNumber || 1,
          pageSize: request?.pageSize || 100,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false
        }
      } as ApiResponse<PagedResult<SyllabusDto>>;
    }

    // Return empty PagedResult
    return {
      success: true,
      message: response?.message || null,
      data: {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 100,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false
      }
    } as ApiResponse<PagedResult<SyllabusDto>>;
  } catch (error) {
    console.error('❌ [GET SYLLABUSES API] Error:', error);
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

// Helper to convert semester enum to string for backend
const getSemesterString = (semester: Semester): string => {
  switch (semester) {
    case Semester.HocKiI:
      return 'HocKiI';
    case Semester.HocKiII:
      return 'HocKiII';
    case Semester.GiuaHocKiI:
      return 'GiuaHocKiI';
    case Semester.GiuaHocKiII:
      return 'GiuaHocKiII';
    case Semester.CuoiHocKiI:
      return 'CuoiHocKiI';
    case Semester.CuoiHocKiII:
      return 'CuoiHocKiII';
    default:
      return 'HocKiI';
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
    // Convert semester enum to string for backend
    const requestData = {
      ...data,
      semester: getSemesterString(data.semester)
    };

    console.log('📤 [CREATE SYLLABUS] Request data:', requestData);

    const response = await BaseRequest.Post<ApiResponse<string>>(
      '/api/v1/syllabus',
      requestData
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
    // Convert semester enum to string if present
    const requestData =
      data.semester !== undefined
        ? { ...data, semester: getSemesterString(data.semester) }
        : data;

    console.log('📤 [UPDATE SYLLABUS] Request ID:', syllabusId);
    console.log('📤 [UPDATE SYLLABUS] Request data:', requestData);

    const response = await BaseRequest.Put<ApiResponse<boolean>>(
      `/api/v1/syllabus/${syllabusId}`,
      requestData
    );

    console.log('✅ [UPDATE SYLLABUS] Response:', response);

    return response;
  } catch (error) {
    console.error('❌ [UPDATE SYLLABUS] Error:', error);
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
