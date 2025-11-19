import axios from 'axios';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse
} from '@/types/auth.type';
import { User } from '@/types/user.type';
import helpers from '@/helpers';

const AUTH_API_URL = `${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000'}/api/v1/Auth`;
const AUTH_PROFILE_API_URL = `${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000'}/api/v1/Auth`;
const USER_PROFILE_API_URL = `${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000'}/api/v1/user`;

// Create a separate axios instance for auth API (without global interceptors)
const authAxios = axios.create({
  baseURL: AUTH_API_URL
});

// Create axios instance for profile API with auth token (for PUT/update operations)
const createProfileAxios = () => {
  const token = helpers.cookie_get('AT');
  return axios.create({
    baseURL: AUTH_PROFILE_API_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  });
};

// Create axios instance for GET profile API with auth token (port 8005)
const createUserProfileAxios = () => {
  const token = helpers.cookie_get('AT');
  return axios.create({
    baseURL: USER_PROFILE_API_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  });
};

export const registerUser = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  try {
    const response = await authAxios.post<RegisterResponse>('/register', data);
    return response.data;
  } catch (error) {
    console.error('Register Error:', error);
    throw error;
  }
};

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await authAxios.post<LoginResponse>('/login', data);

    // Save token and user data to both cookie and localStorage
    if (response.data.success && response.data.data.token) {
      // Save token to cookie (required for ProtectedRoute)
      helpers.cookie_set('AT', response.data.data.token, 7); // 7 days expiry

      // Also save to localStorage for backup
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: response.data.data.id,
          username: response.data.data.username,
          email: response.data.data.email,
          fullName: response.data.data.fullName,
          roleId: response.data.data.roleId,
          roleName: response.data.data.roleName
        })
      );
    }

    return response.data;
  } catch (error) {
    console.error('Login Error:', error);
    throw error;
  }
};

// Profile API Types
export interface ProfileResponse {
  success: boolean;
  message: string;
  data: User;
  errorCode: string | null;
}

export interface UpdateProfileRequest {
  fullName: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: User;
  errorCode: string | null;
}

/**
 * Get user profile
 * @returns ProfileResponse
 */
export const getProfile = async (): Promise<ProfileResponse> => {
  try {
    const userProfileAxios = createUserProfileAxios();
    const response = await userProfileAxios.get<ProfileResponse>('/profile');
    return response.data;
  } catch (error) {
    console.error('Get Profile Error:', error);
    throw error;
  }
};

/**
 * Update user profile (fullName only)
 * @param data - Profile data to update (only fullName)
 * @returns UpdateProfileResponse
 */
export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  try {
    const profileAxios = createProfileAxios();
    const response = await profileAxios.put<UpdateProfileResponse>(
      '/profile',
      data
    );

    // If update successful, update localStorage user data
    if (response.data.success && response.data.data) {
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...user,
            fullName: response.data.data.fullName
          })
        );
      }
    }

    return response.data;
  } catch (error) {
    console.error('Update Profile Error:', error);
    throw error;
  }
};

// Change Password API Types
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data: boolean | null;
  errorCode: string | null;
}

/**
 * Change user password
 * @param data - Password change data (oldPassword and newPassword)
 * @returns ChangePasswordResponse
 */
export const changePassword = async (
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> => {
  try {
    const profileAxios = createProfileAxios();
    const response = await profileAxios.post<ChangePasswordResponse>(
      '/change-password',
      data
    );
    return response.data;
  } catch (error) {
    console.error('Change Password Error:', error);
    throw error;
  }
};
