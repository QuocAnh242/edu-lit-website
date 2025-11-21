import BaseRequest from '@/config/axios.config';

// API Response type
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: number;
  errors?: string[];
}

// Types
export interface LessonContextDto {
  id: string;
  sessionId: string;
  title: string;
  content: string;
  orderIndex: number;
  subsections: SubsectionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface SubsectionDto {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
}

export interface CreateLessonContextRequest {
  sessionId: string;
  parentLessonId?: string;
  lessonTitle: string;
  lessonContent?: string;
  position: number;
  level?: number;
}

export interface CreateSubsectionRequest {
  title: string;
  content: string;
  orderIndex: number;
}

export interface UpdateLessonContextRequest {
  title: string;
  content: string;
  orderIndex: number;
  subsections: UpdateSubsectionRequest[];
}

export interface UpdateSubsectionRequest {
  id?: string;
  title: string;
  content: string;
  orderIndex: number;
}

export interface GetLessonContextsParams {
  pageNumber?: number;
  pageSize?: number;
  sessionId?: string;
  searchTerm?: string;
}

// API Functions
export const getAllLessonContexts = async (
  params: GetLessonContextsParams = {}
): Promise<ApiResponse<{ items: LessonContextDto[] }>> => {
  console.log('🔵 [GET LESSON CONTEXTS API] Request params:', params);

  const queryParams = new URLSearchParams();
  if (params.pageNumber)
    queryParams.append('pageNumber', params.pageNumber.toString());
  if (params.pageSize)
    queryParams.append('pageSize', params.pageSize.toString());
  if (params.sessionId) queryParams.append('sessionId', params.sessionId);
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);

  const url = `/api/v1/lessoncontexts`;
  console.log(' [GET LESSON CONTEXTS API] URL:', url);

  try {
    const response =
      await BaseRequest.Get<ApiResponse<{ items: LessonContextDto[] }>>(url);
    console.log(' [GET LESSON CONTEXTS API] Response:', response);
    return response;
  } catch (error) {
    console.error('❌ [GET LESSON CONTEXTS API] Error:', error);
    throw error;
  }
};

export const getLessonContextById = async (
  id: string
): Promise<ApiResponse<LessonContextDto>> => {
  console.log('🔵 [GET LESSON CONTEXT BY ID API] Request ID:', id);

  try {
    const response = await BaseRequest.Get<ApiResponse<LessonContextDto>>(
      `/api/v1/lessoncontext/${id}`
    );
    console.log('🔵 [GET LESSON CONTEXT BY ID API] Response:', response);
    return response;
  } catch (error) {
    console.error('❌ [GET LESSON CONTEXT BY ID API] Error:', error);
    throw error;
  }
};

export const createLessonContext = async (
  data: CreateLessonContextRequest
): Promise<ApiResponse<string>> => {
  console.log('🔵 [CREATE LESSON CONTEXT API] Request data:', data);

  try {
    const response = await BaseRequest.Post<ApiResponse<string>>(
      '/api/v1/lessoncontexts',
      data
    );
    console.log('🔵 [CREATE LESSON CONTEXT API] Response:', response);
    return response;
  } catch (error) {
    console.error('❌ [CREATE LESSON CONTEXT API] Error:', error);
    throw error;
  }
};

export const updateLessonContext = async (
  id: string,
  data: UpdateLessonContextRequest
): Promise<ApiResponse<object>> => {
  console.log('🔵 [UPDATE LESSON CONTEXT API] Request:', { id, data });

  try {
    const response = await BaseRequest.Put<ApiResponse<object>>(
      `/api/v1/lessoncontext/${id}`,
      data
    );
    console.log('🔵 [UPDATE LESSON CONTEXT API] Response:', response);
    return response;
  } catch (error) {
    console.error('❌ [UPDATE LESSON CONTEXT API] Error:', error);
    throw error;
  }
};

export const deleteLessonContext = async (
  id: string
): Promise<ApiResponse<object>> => {
  console.log('🔵 [DELETE LESSON CONTEXT API] Request ID:', id);

  try {
    const response = await BaseRequest.Delete<ApiResponse<object>>(
      `/api/v1/lessoncontext/${id}`
    );
    console.log('🔵 [DELETE LESSON CONTEXT API] Response:', response);
    return response;
  } catch (error) {
    console.error('❌ [DELETE LESSON CONTEXT API] Error:', error);
    throw error;
  }
};

export const createBulkLessonContexts = async (
  data: CreateLessonContextRequest[]
): Promise<ApiResponse<string[]>> => {
  console.log('🔵 [CREATE BULK LESSON CONTEXTS API] Request data:', data);

  try {
    const response = await BaseRequest.Post<ApiResponse<string[]>>(
      '/api/v1/lessoncontext/bulk',
      data
    );
    console.log('🔵 [CREATE BULK LESSON CONTEXTS API] Response:', response);
    return response;
  } catch (error) {
    console.error('❌ [CREATE BULK LESSON CONTEXTS API] Error:', error);
    throw error;
  }
};
