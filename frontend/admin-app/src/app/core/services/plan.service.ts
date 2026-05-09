import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CreatePlanRequest, Plan } from '../models/plan.model';
import { map } from 'rxjs/operators';

interface ApiResponse<T> { success: boolean; data: T; message: string | null; }

@Injectable({ providedIn: 'root' })
export class PlanService {
  private base = `${environment.apiUrl}/admin/plans`;
  constructor(private http: HttpClient) {}

  getAll(onlyActive = false) {
    return this.http.get<ApiResponse<Plan[]>>(`${this.base}?onlyActive=${onlyActive}`)
      .pipe(map(r => r.data));
  }

  create(req: CreatePlanRequest) {
    return this.http.post<ApiResponse<Plan>>(this.base, req).pipe(map(r => r.data));
  }

  update(id: number, req: CreatePlanRequest) {
    return this.http.put<ApiResponse<Plan>>(`${this.base}/${id}`, req).pipe(map(r => r.data));
  }
}
