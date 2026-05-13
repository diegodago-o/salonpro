import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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

const BRANCH_KEY = 'sp_selected_branch';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private readonly http = inject(HttpClient);

  readonly branches = signal<Branch[]>([]);
  readonly selectedBranch = signal<Branch | null>(this.loadSaved());

  loadBranches(): void {
    this.http.get<ApiResponse<Branch[]>>(`${environment.apiUrl}/branches?onlyActive=true`)
      .subscribe({
        next: (res) => {
          this.branches.set(res.data);
          // If saved branch is no longer in the list, default to first
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
