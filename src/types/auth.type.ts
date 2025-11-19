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

// Login Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roleId: string;
  roleName: string;
  token: string;
  createdAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginData;
  errorCode: string | null;
}

// Forget Password Types
export interface ForgetPasswordRequest {
  email: string;
}

export interface ForgetPasswordResponse {
  success: boolean;
  message: string;
  data: boolean;
  errorCode: string | null;
}

// Reset Password Types
export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  data: boolean;
  errorCode: string | null;
}

// Change Password Types
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data: boolean;
  errorCode: string | null;
}

// Google Login Types
export interface GoogleLoginRequest {
  idToken: string;
}

export interface GoogleLoginResponse {
  success: boolean;
  message: string;
  data: LoginData;
  errorCode: string | null;
}
