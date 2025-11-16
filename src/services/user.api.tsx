import axios from 'axios';
import {
  GetUserResponse,
  UpdateUserRequest,
  UpdateUserResponse
} from '@/types/user.type';
import helpers from '@/helpers';

const USER_API_URL = `${import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000'}/api/v1/User`;

// Create axios instance with auth token
const createAuthAxios = () => {
  const token = helpers.cookie_get('AT');
  return axios.create({
    baseURL: USER_API_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  });
};

/**
 * Get user by ID
 * @param userId - User ID to fetch
 * @returns GetUserResponse
 */
export const getUserById = async (userId: string): Promise<GetUserResponse> => {
  try {
    const authAxios = createAuthAxios();
    const response = await authAxios.get<GetUserResponse>(`/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get User Error:', error);
    throw error;
  }
};

/**
 * Update user information
 * @param userId - User ID to update
 * @param data - User data to update
 * @returns UpdateUserResponse
 */
export const updateUser = async (
  userId: string,
  data: UpdateUserRequest
): Promise<UpdateUserResponse> => {
  try {
    const authAxios = createAuthAxios();
    const response = await authAxios.put<UpdateUserResponse>(
      `/${userId}`,
      data
    );

    // If update successful, update localStorage user data
    if (response.data.success) {
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...user,
            username: data.username,
            email: data.email,
            fullName: data.fullName
          })
        );
      }
    }

    return response.data;
  } catch (error) {
    console.error('Update User Error:', error);
    throw error;
  }
};
