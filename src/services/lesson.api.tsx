import BaseRequest from '@/config/axios.config';

// DTO Types
export interface LessonContextDto {
  lessonContextId: string;
  sessionId?: string;
  parentId?: string | null;
  title: string;
  content: string;
  position: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityDto {
  activityId: string;
  sessionId: string;
  title: string;
  description?: string;
  activityType: string;
  instructions?: string;
  estimatedTimeMinutes: number;
  position: number;
  materials: string[];
  objectives: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LessonDto {
  lessonId: string;
  sessionId: string;
  title: string;
  description: string;
  durationMinutes: number;
  position: number;
  lessonContexts: LessonContextDto[];
  activities: ActivityDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Get all lessons
export const getAllLessons = async (): Promise<ApiResponse<LessonDto[]>> => {
  console.log('🔵 [GET LESSONS API] Fetching all lessons');
  const response =
    await BaseRequest.Get<ApiResponse<LessonDto[]>>('/api/v1/lessons');
  console.log('🔵 [GET LESSONS API] Response:', response);
  return response;
};

// Get lesson by ID
export const getLessonById = async (
  id: string
): Promise<ApiResponse<LessonDto>> => {
  console.log('🔵 [GET LESSON BY ID API] Fetching lesson:', id);
  const response = await BaseRequest.Get<ApiResponse<LessonDto>>(
    `/api/v1/lessons/${id}`
  );
  console.log('🔵 [GET LESSON BY ID API] Response:', response);
  return response;
};
