import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, UserInfo } from '../models/auth.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'sp_token';
  private readonly REFRESH_KEY = 'sp_refresh';
  private readonly USER_KEY = 'sp_user';

  private _user = signal<UserInfo | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  private _refreshing = false;
  private _refresh$ = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest) {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap(res => {
        if (res.success) this.saveSession(res.data);
      })
    );
  }

  logout() {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  tryRefresh(): Observable<string> {
    if (this._refreshing) {
      return this._refresh$.asObservable().pipe(
        filter((t): t is string => t !== null),
        take(1)
      );
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      this.router.navigate(['/login']);
      return throwError(() => new Error('No refresh token'));
    }

    this._refreshing = true;
    this._refresh$.next(null);

    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap(res => {
          this._refreshing = false;
          if (res.success) {
            this.saveSession(res.data);
            this._refresh$.next(res.data.accessToken);
          }
        }),
        map(res => res.data.accessToken),
        catchError(err => {
          this._refreshing = false;
          this.clearSession();
          this.router.navigate(['/login']);
          return throwError(() => err);
        })
      );
  }

  private saveSession(auth: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, auth.accessToken);
    localStorage.setItem(this.REFRESH_KEY, auth.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(auth.user));
    this._user.set(auth.user);
  }

  private clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
  }

  private loadUser(): UserInfo | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
