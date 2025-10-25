// Auth Types
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface RegisterData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roleId: string;
  roleName: string;
  token: string;
  createdAt: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: RegisterData;
  errorCode: string | null;
}
