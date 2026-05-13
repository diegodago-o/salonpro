import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthUser } from '../models/auth.models';

export interface Branch {
  id: number;
  tenantId: number;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ApiResponse<T> { success: boolean; data: T; message: string; }

export const BRANCH_KEY = 'sp_selected_branch';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private readonly http = inject(HttpClient);

  readonly branches = signal<Branch[]>([]);
  readonly selectedBranch = signal<Branch | null>(this.loadSaved());

  /**
   * Carga las sedes disponibles según el rol del usuario.
   * - Stylist / Cashier: fija su sede del JWT, sin llamada al API.
   * - TenantOwner: carga todas las sedes activas del API.
   */
  loadBranches(user: AuthUser | null): void {
    // Estilistas y cajeros tienen sede fija — la tomamos directo del JWT
    if (user && (user.role === 'Stylist' || user.role === 'Cashier')) {
      const branch: Branch = {
        id: user.branchId,
        tenantId: user.tenantId,
        name: user.branchName,
        address: null, city: null, phone: null,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      this.branches.set([branch]);
      this.select(branch);
      return;
    }

    // TenantOwner: carga todas las sedes activas
    this.http.get<ApiResponse<Branch[]>>(`${environment.apiUrl}/branches?onlyActive=true`)
      .subscribe({
        next: (res) => {
          this.branches.set(res.data);
          const saved = this.selectedBranch();
          if (saved && !res.data.find(b => b.id === saved.id)) {
            this.select(res.data[0] ?? null);
          } else if (!saved && res.data.length > 0) {
            this.select(res.data[0]);
          }
        },
        error: () => { /* silently ignore — shell still shows branchName from token */ }
      });
  }

  /** Limpia la sede guardada (llamar en logout y al inicio de cada sesión). */
  clearSaved(): void {
    this.selectedBranch.set(null);
    localStorage.removeItem(BRANCH_KEY);
  }

  select(branch: Branch | null): void {
    this.selectedBranch.set(branch);
    if (branch) {
      localStorage.setItem(BRANCH_KEY, JSON.stringify(branch));
    } else {
      localStorage.removeItem(BRANCH_KEY);
    }
  }

  get currentBranchId(): number | null {
    return this.selectedBranch()?.id ?? null;
  }

  private loadSaved(): Branch | null {
    const raw = localStorage.getItem(BRANCH_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
