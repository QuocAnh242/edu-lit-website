import axios from 'axios';
import { RegisterRequest, RegisterResponse } from '@/types/auth.type';

const AUTH_API_URL = `${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000'}/api/v1/Auth`;

export const registerUser = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  try {
    const response = await axios.post<RegisterResponse>(
      `${AUTH_API_URL}/register`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Register Error:', error);
    throw error;
  }
};
