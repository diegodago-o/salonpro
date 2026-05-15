import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Branch, CreateBranchRequest, CreateTenantRequest, CreateTenantResponse, PagedResult, Tenant, TenantOwner, UpdateSubscriptionRequest } from '../models/tenant.model';
import { map } from 'rxjs/operators';

interface ApiResponse<T> { success: boolean; data: T; message: string | null; }

@Injectable({ providedIn: 'root' })
export class TenantService {
  private base = `${environment.apiUrl}/admin/tenants`;

  constructor(private http: HttpClient) {}

  getAll(search?: string, status?: string, page = 1, pageSize = 20) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<PagedResult<Tenant>>>(this.base, { params })
      .pipe(map(r => r.data));
  }

  getById(id: number) {
    return this.http.get<ApiResponse<Tenant>>(`${this.base}/${id}`)
      .pipe(map(r => r.data));
  }

  create(req: CreateTenantRequest) {
    return this.http.post<ApiResponse<CreateTenantResponse>>(this.base, req)
      .pipe(map(r => r.data));
  }

  update(id: number, req: Partial<Tenant>) {
    return this.http.put<ApiResponse<Tenant>>(`${this.base}/${id}`, req)
      .pipe(map(r => r.data));
  }

  delete(id: number) {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }

  changeStatus(id: number, status: string) {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/status`, { status });
  }

  getBranches(tenantId: number) {
    return this.http.get<ApiResponse<Branch[]>>(`${this.base}/${tenantId}/branches`)
      .pipe(map(r => r.data));
  }

  createBranch(tenantId: number, req: CreateBranchRequest) {
    return this.http.post<ApiResponse<Branch>>(`${this.base}/${tenantId}/branches`, req)
      .pipe(map(r => r.data));
  }

  updateSubscription(tenantId: number, req: UpdateSubscriptionRequest) {
    return this.http.put<ApiResponse<any>>(`${this.base}/${tenantId}/subscription`, req)
      .pipe(map(r => r.data));
  }

  getOwner(tenantId: number) {
    return this.http.get<ApiResponse<TenantOwner>>(`${this.base}/${tenantId}/owner`)
      .pipe(map(r => r.data));
  }

  resetOwnerPassword(tenantId: number, newPassword: string) {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${tenantId}/owner/password`, { newPassword });
  }
}
