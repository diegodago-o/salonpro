export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  fullName: string;
  email: string;
  role: string;
  tenantId: number | null;
  branchId: number | null;
  commissionPercent: number;
}
