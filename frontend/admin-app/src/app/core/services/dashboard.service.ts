import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Dashboard } from '../models/dashboard.model';
import { map } from 'rxjs/operators';

interface ApiResponse<T> { success: boolean; data: T; }

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  get() {
    return this.http.get<ApiResponse<Dashboard>>(`${environment.apiUrl}/admin/dashboard`)
      .pipe(map(r => r.data));
  }
}
