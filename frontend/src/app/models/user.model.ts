export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'employee';
  isActive: boolean;
  address?: string;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  data: User;
}

export interface AuthResponse {
  success: boolean;
  data?: User;
  message?: string;
}
