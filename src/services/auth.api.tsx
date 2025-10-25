import axios from 'axios';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse
} from '@/types/auth.type';
import helpers from '@/helpers';

const AUTH_API_URL = `${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000'}/api/v1/Auth`;

// Create a separate axios instance for auth API (without global interceptors)
const authAxios = axios.create({
  baseURL: AUTH_API_URL
});

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
