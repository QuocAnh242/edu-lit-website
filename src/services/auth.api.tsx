import axios from 'axios';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  ForgetPasswordRequest,
  ForgetPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  GoogleLoginRequest,
  GoogleLoginResponse
} from '@/types/auth.type';
import helpers from '@/helpers';

const AUTH_API_URL = `${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000'}/api/v1/auth`;

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

export const forgetPassword = async (
  data: ForgetPasswordRequest
): Promise<ForgetPasswordResponse> => {
  try {
    const response = await authAxios.post<ForgetPasswordResponse>(
      '/forget-password',
      data
    );
    return response.data;
  } catch (error) {
    console.error('Forget Password Error:', error);
    throw error;
  }
};

export const resetPassword = async (
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  try {
    const response = await authAxios.post<ResetPasswordResponse>(
      '/reset-password',
      data
    );
    return response.data;
  } catch (error) {
    console.error('Reset Password Error:', error);
    throw error;
  }
};

export const changePassword = async (
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> => {
  try {
    // Get auth token from cookie
    const token = helpers.cookie_get('AT');

    // Create axios instance with auth header
    const authAxiosWithToken = axios.create({
      baseURL: AUTH_API_URL,
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });

    const response = await authAxiosWithToken.post<ChangePasswordResponse>(
      '/change-password',
      data
    );
    return response.data;
  } catch (error) {
    console.error('Change Password Error:', error);
    throw error;
  }
};

export const googleLogin = async (
  data: GoogleLoginRequest
): Promise<GoogleLoginResponse> => {
  try {
    const response = await authAxios.post<GoogleLoginResponse>(
      '/google-login',
      { idToken: data.idToken }
    );

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
    console.error('Google Login Error:', error);
    throw error;
  }
};
