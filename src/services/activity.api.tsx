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
export interface ActivityDto {
  id: string;
  sessionId: string;
  lessonContextId: string;
  title: string;
  teacherStudentActivities: string;
  expectedOutcomes: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityRequest {
  sessionId: string;
  title: string;
  description?: string;
  activityType: string;
  content?: string;
  points?: number;
  position: number;
  isRequired?: boolean;
}

export interface UpdateActivityRequest {
  title: string;
  teacherStudentActivities: string;
  expectedOutcomes: string;
  orderIndex: number;
}

export interface GetActivitiesParams {
  pageNumber?: number;
  pageSize?: number;
  lessonContextId?: string;
  searchTerm?: string;
}

// API Functions
export const getAllActivities = async (
  params: GetActivitiesParams & { sessionId?: string } = {}
): Promise<ApiResponse<{ items: ActivityDto[] }>> => {
  console.log(' [GET ACTIVITIES API] Request params:', params);

  const queryParams = new URLSearchParams();
  if (params.pageNumber)
    queryParams.append('pageNumber', params.pageNumber.toString());
  if (params.pageSize)
    queryParams.append('pageSize', params.pageSize.toString());
  if (params.lessonContextId)
    queryParams.append('lessonContextId', params.lessonContextId);
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
  if (params.sessionId) queryParams.append('sessionId', params.sessionId);

  const url = `/api/v1/activities`;
  console.log(' [GET ACTIVITIES API] URL:', url);

  try {
    const response =
      await BaseRequest.Get<ApiResponse<{ items: ActivityDto[] }>>(url);
    console.log(' [GET ACTIVITIES API] Response:', response);
    return response;
  } catch (error) {
    console.error('❌ [GET ACTIVITIES API] Error:', error);
    throw error;
  }
};

export const getActivityById = async (
  id: string
): Promise<ApiResponse<ActivityDto>> => {
  console.log('🟢 [GET ACTIVITY BY ID API] Request ID:', id);

  try {
    const response = await BaseRequest.Get<ApiResponse<ActivityDto>>(
      `/api/v1/activities/${id}`
    );
    console.log('🟢 [GET ACTIVITY BY ID API] Response:', response);
    return response;
  } catch (error) {
    console.error('❌ [GET ACTIVITY BY ID API] Error:', error);
    throw error;
  }
};

export const createActivity = async (
  data: CreateActivityRequest
): Promise<ApiResponse<string>> => {
  console.log('🟢 [CREATE ACTIVITY API] Request data:', data);

  try {
    const response = await BaseRequest.Post<ApiResponse<string>>(
      '/api/v1/activities',
      data
    );
    console.log('🟢 [CREATE ACTIVITY API] Response:', response);
    return response;
  } catch (error) {
    console.error('❌ [CREATE ACTIVITY API] Error:', error);
    throw error;
  }
};

export const updateActivity = async (
  id: string,
  data: UpdateActivityRequest
): Promise<ApiResponse<object>> => {
  console.log('🟢 [UPDATE ACTIVITY API] Request:', { id, data });

  try {
    const response = await BaseRequest.Put<ApiResponse<object>>(
      `/api/v1/activities/${id}`,
      data
    );
    console.log('🟢 [UPDATE ACTIVITY API] Response:', response);
    return response;
  } catch (error) {
    console.error('❌ [UPDATE ACTIVITY API] Error:', error);
    throw error;
  }
};

export const deleteActivity = async (
  id: string
): Promise<ApiResponse<object>> => {
  console.log('🟢 [DELETE ACTIVITY API] Request ID:', id);

  try {
    const response = await BaseRequest.Delete<ApiResponse<object>>(
      `/api/v1/activities/${id}`
    );
    console.log('🟢 [DELETE ACTIVITY API] Response:', response);
    return response;
  } catch (error) {
    console.error('❌ [DELETE ACTIVITY API] Error:', error);
    throw error;
  }
};
