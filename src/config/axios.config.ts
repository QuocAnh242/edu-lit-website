import axios, { AxiosResponse } from 'axios';
import helpers from '../helpers';

// Use environment variable or default to localhost:8000 for local development
// For Vite, environment variables must be prefixed with VITE_
const baseURL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';

const onRequestSuccess = (config: any) => {
  config.headers['Authorization'] = `Bearer ${helpers.cookie_get('AT')}`;
  return config;
};
const onRequestError = (error: any) => {
  return Promise.reject(error);
};
const onResponseSuccess = (response: AxiosResponse) => {
  // Axios response interceptor always receives an AxiosResponse object
  // Use optional chaining and nullish coalescing for maximum safety
  try {
    // Safely access response.data with optional chaining
    // If response or response.data is undefined/null, return null
    return response?.data ?? null;
  } catch (error) {
    // If anything goes wrong, log it and return null to prevent crashes
    console.error('Error in response success interceptor:', error);
    console.error('Response object:', response);
    return null;
  }
};
const onResponseError = (error: any) => {
  // Handle network errors or errors without response
  if (!error.response) {
    console.error('Network error or no response:', error.message || error);
    return Promise.reject(error);
  }

  // Handle authentication errors
  if (
    (error.response.status === 403 &&
      error.response.data?.message === 'Token expired') ||
    error.response.status === 401
  ) {
    helpers.cookie_delete('AT');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/signin';
  }

  // Return the error response data (extracted by interceptor pattern)
  // The error response should have data property
  if (error.response.data !== undefined) {
    return Promise.reject(error.response.data);
  }

  // Fallback: return the full error response
  return Promise.reject(error.response);
};
axios.interceptors.request.use(onRequestSuccess, onRequestError);
axios.interceptors.response.use(onResponseSuccess, onResponseError);
axios.defaults.baseURL = baseURL;

const BaseRequest = {
  Get: async <T = any>(url: string) => {
    try {
      const response: any = await axios.get<T>(url);
      return response; // Trả về toàn bộ response thay vì chỉ response.data
    } catch (err) {
      console.error('GET Error:', err);
      throw err;
    }
  },

  Post: async <T = any, D = any>(url: string, data?: D) => {
    try {
      const response: any = await axios.post<T>(url, data);
      // Response is already processed by interceptor (returns response.data)
      // So response here is the actual data, not the AxiosResponse object
      // Handle case where interceptor might return null
      if (response === null || response === undefined) {
        throw new Error('Server returned null response');
      }
      return response;
    } catch (err: any) {
      console.error('POST Error:', err);
      // Handle different error types
      // If it's already an Error object, throw it
      if (err instanceof Error) {
        throw err;
      }
      // If it's an axios error with response data (from error interceptor)
      if (err && typeof err === 'object') {
        // Error interceptor already extracts error.response.data
        // So err here is the error response data
        throw err;
      }
      // Fallback: create a generic error
      throw new Error(err?.message || 'Failed to create resource');
    }
  },

  Put: async <T = any, D = any>(url: string, data?: D) => {
    try {
      const response: any = await axios.put<T>(url, data);
      return response;
    } catch (err) {
      console.error('PUT Error:', err);
      throw err;
    }
  },

  Patch: async <T = any, D = any>(url: string, data?: D) => {
    try {
      const response: any = await axios.patch<T>(url, data);
      return response;
    } catch (err) {
      console.error('PATCH Error:', err);
      throw err;
    }
  },

  Delete: async <T = any>(url: string) => {
    try {
      const response: any = await axios.delete<T>(url);
      // Response is already processed by interceptor (returns response.data)
      // So response here is the actual data, not the AxiosResponse object
      if (response === null || response === undefined) {
        throw new Error('Server returned null response');
      }
      return response;
    } catch (err: any) {
      console.error('DELETE Error:', err);
      if (err instanceof Error) {
        throw err;
      }
      if (err && typeof err === 'object') {
        throw err;
      }
      throw new Error(err?.message || 'Failed to delete resource');
    }
  }
};

const BaseRequestV2 = {
  Get: async <T = any>(url: string) => {
    try {
      const res: AxiosResponse<T> = await axios.get(url);
      return [null, res]; // Trả về toàn bộ response thay vì chỉ res.data
    } catch (err: any) {
      return [err?.response || err, null]; // Trả về toàn bộ lỗi response nếu có
    }
  },

  Post: async <T = any>(url: string, data?: any) => {
    try {
      const res: AxiosResponse<T> = await axios.post(url, data);
      return [null, res];
    } catch (err: any) {
      return [err?.response || err, null];
    }
  },

  Put: async <T = any>(url: string, data?: any) => {
    try {
      const res: AxiosResponse<T> = await axios.put(url, data);
      return [null, res];
    } catch (err: any) {
      return [err?.response || err, null];
    }
  },

  Delete: async <T = any>(url: string) => {
    try {
      const res: AxiosResponse<T> = await axios.delete(url);
      return [null, res];
    } catch (err: any) {
      return [err?.response || err, null];
    }
  }
};

export default BaseRequest;
export { BaseRequestV2 };
