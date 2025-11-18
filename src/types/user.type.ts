// User Types

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roleId: string;
  roleName: string | null;
  token: string | null;
  createdAt: string;
}

export interface GetUserResponse {
  success: boolean;
  message: string;
  data: User;
  errorCode: string | null;
}

export interface UpdateUserRequest {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roleId: string;
  roleName: string | null;
  token: string | null;
  createdAt: string;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  data: boolean;
  errorCode: string | null;
}
