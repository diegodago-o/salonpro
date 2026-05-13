import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ApiResponse, AuthUser, LoginRequest, LoginResponse } from '../models/auth.models';
import { BranchService } from './branch.service';
import { environment } from '../../../environments/environment';

const ACCESS_TOKEN_KEY = 'sp_access_token';
const REFRESH_TOKEN_KEY = 'sp_refresh_token';
const USER_KEY = 'sp_user';

const MOCK_USER: AuthUser = {
  id: 1,
  fullName: 'Admin Demo',
  email: 'admin@demo.com',
  role: 'TenantOwner',
  branchId: 1,
  branchName: 'Sede Principal',
  tenantId: 1,
  tenantName: 'Salón Demo'
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly branchService = inject(BranchService);

  readonly currentUser = signal<AuthUser | null>(this.loadUser());
  readonly isAuthenticated = signal<boolean>(!!this.getAccessToken());

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    if (!environment.production && request.email === 'admin@demo.com' && request.password === 'demo123') {
      const mockResponse: ApiResponse<LoginResponse> = {
        success: true,
        message: 'Login mock exitoso',
        errors: [],
        data: {
          accessToken: 'mock-token-dev',
          refreshToken: 'mock-refresh-dev',
          expiresIn: 3600,
          user: MOCK_USER
        }
      };
      this.saveSession(mockResponse.data);
      return of(mockResponse);
    }

    return this.http.post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap(response => {
        if (response.success) {
          this.saveSession(response.data);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.branchService.clearSaved();   // ← limpia sede al cerrar sesión
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private saveSession(data: LoginResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    this.branchService.clearSaved();   // ← resetea la sede al cambiar de usuario
    this.currentUser.set(data.user);
    this.isAuthenticated.set(true);
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
