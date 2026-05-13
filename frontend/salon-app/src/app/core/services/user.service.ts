import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SalonUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  tenantId: number | null;
  branchId: number | null;
  commissionPercent: number;
  branchName: string | null;
  tenantName: string | null;
  isActive: boolean;
  employeeCode: string | null;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
  branchId: number | null;
  branchName: string | null;
  documentType: string | null;
  documentNumber: string | null;
  phone: string | null;
  commissionPercent: number;
  tenantId?: number | null;
  tenantName?: string | null;
  employeeCode?: string | null;
}

interface ApiResponse<T> { success: boolean; data: T; message: string; errors: string[]; }

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  getAll(role?: string) {
    const url = role ? `${this.base}?role=${role}` : this.base;
    return this.http.get<ApiResponse<SalonUser[]>>(url).pipe(map(r => r.data));
  }

  create(req: CreateUserRequest) {
    return this.http.post<ApiResponse<SalonUser>>(this.base, req).pipe(map(r => r.data));
  }

  toggle(id: number) {
    return this.http.patch<ApiResponse<{ isActive: boolean }>>(`${this.base}/${id}/toggle`, {})
      .pipe(map(r => r.data));
  }
}
