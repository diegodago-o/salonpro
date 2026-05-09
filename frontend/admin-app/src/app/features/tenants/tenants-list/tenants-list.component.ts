import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '../../../core/services/tenant.service';
import { Tenant, TenantStatus, CreateTenantRequest, PagedResult } from '../../../core/models/tenant.model';
import { Plan } from '../../../core/models/plan.model';
import { PlanService } from '../../../core/services/plan.service';

@Component({
  selector: 'app-tenants-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tenants">
      <div class="page-header">
        <div>
          <h1 class="page-title">Salones</h1>
          <span class="page-subtitle">Gestión de tenants de la plataforma</span>
        </div>
        <button class="btn-primary" (click)="openCreate()">+ Nuevo salón</button>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input
          class="search-input"
          type="text"
          placeholder="Buscar por nombre, slug, NIT…"
          [(ngModel)]="search"
          (ngModelChange)="onSearch()"
        />
        <select class="select-filter" [(ngModel)]="statusFilter" (ngModelChange)="onFilter()">
          <option value="">Todos los estados</option>
          <option value="Trial">En prueba</option>
          <option value="Active">Activos</option>
          <option value="Suspended">Suspendidos</option>
          <option value="Cancelled">Cancelados</option>
        </select>
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="loading-indicator">Cargando…</div>
      }

      @if (!loading() && tenants().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">🏪</span>
          <p>No se encontraron salones</p>
        </div>
      }

      @if (!loading() && tenants().length > 0) {
        <div class="table-card">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Salón</th>
                  <th>Slug</th>
                  <th>NIT</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Sedes</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (t of tenants(); track t.id) {
                  <tr>
                    <td>
                      <div class="tenant-name">{{ t.businessName }}</div>
                      @if (t.tradeName) {
                        <div class="tenant-trade">{{ t.tradeName }}</div>
                      }
                    </td>
                    <td><code class="slug">{{ t.slug }}</code></td>
                    <td>{{ t.nit }}</td>
                    <td>{{ t.subscription?.planName ?? '—' }}</td>
                    <td>
                      <span class="badge" [class]="'badge-' + t.status.toLowerCase()">
                        {{ statusLabel(t.status) }}
                      </span>
                    </td>
                    <td>{{ t.branchCount }}</td>
                    <td>{{ t.createdAt | date:'dd/MM/yyyy' }}</td>
                    <td>
                      <div class="actions">
                        <button class="btn-icon" title="Editar" (click)="openEdit(t)">✏️</button>
                        @if (t.status !== 'Suspended' && t.status !== 'Cancelled') {
                          <button class="btn-icon danger" title="Suspender" (click)="changeStatus(t, 'Suspended')">🚫</button>
                        }
                        @if (t.status === 'Suspended') {
                          <button class="btn-icon success" title="Activar" (click)="changeStatus(t, 'Active')">✅</button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="pagination">
              <span class="pagination-info">
                Mostrando {{ (page() - 1) * pageSize + 1 }}–{{ min(page() * pageSize, total()) }} de {{ total() }}
              </span>
              <div class="pagination-btns">
                <button [disabled]="page() === 1" (click)="goPage(page() - 1)">‹</button>
                @for (p of pageRange(); track p) {
                  <button [class.active]="p === page()" (click)="goPage(p)">{{ p }}</button>
                }
                <button [disabled]="page() === totalPages()" (click)="goPage(page() + 1)">›</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- MODAL: Create / Edit -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingTenant() ? 'Editar salón' : 'Nuevo salón' }}</h3>
              <button class="modal-close" (click)="closeModal()">×</button>
            </div>
            <div class="modal-body">
              @if (modalError()) {
                <div class="alert-error">{{ modalError() }}</div>
              }

              <div class="form-grid">
                <!-- Business name -->
                <div class="field full">
                  <label>Nombre del negocio *</label>
                  <input type="text" [(ngModel)]="form.businessName" placeholder="Salón Ejemplo" />
                </div>
                <div class="field full">
                  <label>Nombre comercial</label>
                  <input type="text" [(ngModel)]="form.tradeName" placeholder="Opcional" />
                </div>
                <div class="field">
                  <label>NIT *</label>
                  <input type="text" [(ngModel)]="form.nit" placeholder="900123456" [disabled]="!!editingTenant()" />
                </div>
                <div class="field">
                  <label>Slug *</label>
                  <input type="text" [(ngModel)]="form.slug" placeholder="mi-salon" [disabled]="!!editingTenant()" />
                </div>
                <div class="field">
                  <label>Correo *</label>
                  <input type="email" [(ngModel)]="form.email" placeholder="salon@ejemplo.com" />
                </div>
                <div class="field">
                  <label>Teléfono</label>
                  <input type="text" [(ngModel)]="form.phone" placeholder="3001234567" />
                </div>
                <div class="field full">
                  <label>Dirección</label>
                  <input type="text" [(ngModel)]="form.address" placeholder="Calle 10 #5-30" />
                </div>
                <div class="field">
                  <label>Ciudad</label>
                  <input type="text" [(ngModel)]="form.city" placeholder="Bogotá" />
                </div>

                @if (!editingTenant()) {
                  <div class="field-separator full"><span>Plan y facturación</span></div>
                  <div class="field">
                    <label>Plan *</label>
                    <select [(ngModel)]="form.planId">
                      <option [ngValue]="0" disabled>Seleccionar plan</option>
                      @for (p of plans(); track p.id) {
                        <option [ngValue]="p.id">{{ p.name }} — {{ p.priceMonthly | currency:'COP':'symbol-narrow':'1.0-0' }}/mes</option>
                      }
                    </select>
                  </div>
                  <div class="field">
                    <label>Sedes extra</label>
                    <input type="number" [(ngModel)]="form.extraBranches" min="0" />
                  </div>
                  <div class="field">
                    <label>Ciclo de facturación</label>
                    <select [(ngModel)]="form.billingCycle">
                      <option value="Monthly">Mensual</option>
                      <option value="Annual">Anual</option>
                    </select>
                  </div>

                  <div class="field-separator full"><span>Sede principal</span></div>
                  <div class="field full">
                    <label>Nombre de la sede *</label>
                    <input type="text" [(ngModel)]="form.branchName" placeholder="Sede Principal" />
                  </div>
                  <div class="field">
                    <label>Dirección sede</label>
                    <input type="text" [(ngModel)]="form.branchAddress" />
                  </div>
                  <div class="field">
                    <label>Ciudad sede</label>
                    <input type="text" [(ngModel)]="form.branchCity" />
                  </div>

                  <div class="field-separator full"><span>Propietario</span></div>
                  <div class="field">
                    <label>Nombre completo *</label>
                    <input type="text" [(ngModel)]="form.ownerFullName" />
                  </div>
                  <div class="field">
                    <label>Documento *</label>
                    <input type="text" [(ngModel)]="form.ownerDocument" />
                  </div>
                  <div class="field">
                    <label>Correo propietario *</label>
                    <input type="email" [(ngModel)]="form.ownerEmail" />
                  </div>
                  <div class="field">
                    <label>Contraseña *</label>
                    <input type="password" [(ngModel)]="form.ownerPassword" placeholder="Mínimo 8 caracteres" />
                  </div>
                }
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button class="btn-primary" (click)="save()" [disabled]="saving()">
                {{ saving() ? 'Guardando…' : (editingTenant() ? 'Guardar cambios' : 'Crear salón') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tenants { max-width: 1300px; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
    }
    .page-title { font-size: 26px; font-weight: 700; color: #1a1f2e; margin: 0 0 4px; }
    .page-subtitle { color: #8892a4; font-size: 14px; }

    .filters {
      display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
    }
    .search-input {
      flex: 1; min-width: 220px; padding: 9px 14px;
      border: 1.5px solid #e5e7eb; border-radius: 8px;
      font-size: 14px; outline: none;
    }
    .search-input:focus { border-color: #6c63ff; }
    .select-filter {
      padding: 9px 14px; border: 1.5px solid #e5e7eb; border-radius: 8px;
      font-size: 14px; background: #fff; outline: none; cursor: pointer;
    }
    .select-filter:focus { border-color: #6c63ff; }

    .table-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      text-align: left; font-size: 12px; font-weight: 600;
      color: #8892a4; text-transform: uppercase; letter-spacing: 0.04em;
      padding: 12px 16px; border-bottom: 2px solid #f3f4f6; white-space: nowrap;
    }
    .data-table td {
      padding: 14px 16px; font-size: 14px; color: #374151;
      border-bottom: 1px solid #f3f4f6;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f9fafb; }

    .tenant-name { font-weight: 600; }
    .tenant-trade { font-size: 12px; color: #8892a4; }
    .slug { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; }

    .badge {
      display: inline-block; padding: 3px 10px;
      border-radius: 20px; font-size: 12px; font-weight: 600;
    }
    .badge-active    { background: #d1fae5; color: #065f46; }
    .badge-trial     { background: #fef3c7; color: #92400e; }
    .badge-suspended { background: #fee2e2; color: #991b1b; }
    .badge-cancelled { background: #f3f4f6; color: #6b7280; }

    .actions { display: flex; gap: 4px; }
    .btn-icon {
      background: none; border: 1px solid #e5e7eb; border-radius: 6px;
      padding: 4px 8px; cursor: pointer; font-size: 14px; transition: all 0.15s;
    }
    .btn-icon:hover { background: #f3f4f6; }
    .btn-icon.danger:hover { background: #fee2e2; border-color: #fca5a5; }
    .btn-icon.success:hover { background: #d1fae5; border-color: #6ee7b7; }

    .pagination {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-top: 1px solid #f3f4f6; flex-wrap: wrap; gap: 8px;
    }
    .pagination-info { font-size: 13px; color: #8892a4; }
    .pagination-btns { display: flex; gap: 4px; }
    .pagination-btns button {
      min-width: 34px; height: 34px; padding: 0 8px;
      border: 1.5px solid #e5e7eb; background: #fff;
      border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.15s;
    }
    .pagination-btns button:hover:not(:disabled) { background: #f3f4f6; }
    .pagination-btns button.active { background: #6c63ff; color: #fff; border-color: #6c63ff; }
    .pagination-btns button:disabled { opacity: 0.4; cursor: not-allowed; }

    .loading-indicator { text-align: center; padding: 40px; color: #8892a4; }
    .empty-state { text-align: center; padding: 60px 20px; color: #8892a4; }
    .empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }

    /* Buttons */
    .btn-primary {
      background: #6c63ff; color: #fff; border: none;
      padding: 9px 20px; border-radius: 8px; font-size: 14px;
      font-weight: 600; cursor: pointer; transition: background 0.2s;
    }
    .btn-primary:hover:not(:disabled) { background: #5a52d5; }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
    .btn-secondary {
      background: #f3f4f6; color: #374151; border: none;
      padding: 9px 20px; border-radius: 8px; font-size: 14px;
      font-weight: 600; cursor: pointer; transition: background 0.2s;
    }
    .btn-secondary:hover { background: #e5e7eb; }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 20px;
    }
    .modal {
      background: #fff; border-radius: 16px; width: 100%;
      max-width: 680px; max-height: 90vh;
      display: flex; flex-direction: column;
      box-shadow: 0 24px 80px rgba(0,0,0,0.25);
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid #f3f4f6;
    }
    .modal-header h3 { font-size: 18px; font-weight: 700; color: #1a1f2e; margin: 0; }
    .modal-close {
      background: none; border: none; font-size: 24px;
      cursor: pointer; color: #8892a4; line-height: 1;
    }
    .modal-close:hover { color: #374151; }
    .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
    .modal-footer {
      padding: 16px 24px; border-top: 1px solid #f3f4f6;
      display: flex; justify-content: flex-end; gap: 12px;
    }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field.full { grid-column: span 2; }
    .field label { font-size: 13px; font-weight: 600; color: #374151; }
    .field input, .field select {
      padding: 9px 12px; border: 1.5px solid #e5e7eb;
      border-radius: 8px; font-size: 14px; outline: none;
    }
    .field input:focus, .field select:focus { border-color: #6c63ff; }
    .field input:disabled { background: #f9fafb; color: #8892a4; cursor: not-allowed; }

    .field-separator {
      border-top: 1px solid #f3f4f6; padding-top: 4px;
      font-size: 12px; font-weight: 700; color: #6c63ff;
      text-transform: uppercase; letter-spacing: 0.06em;
      display: flex; align-items: center; gap: 8px;
    }
    .field-separator::before { content: ''; flex: 0 0 0; }

    .alert-error {
      background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
      border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px;
    }
  `]
})
export class TenantsListComponent implements OnInit {
  tenants = signal<Tenant[]>([]);
  plans = signal<Plan[]>([]);
  loading = signal(true);
  page = signal(1);
  total = signal(0);
  totalPages = signal(1);
  pageSize = 20;
  search = '';
  statusFilter = '';
  private searchTimer: any;

  showModal = signal(false);
  editingTenant = signal<Tenant | null>(null);
  saving = signal(false);
  modalError = signal('');

  form: CreateTenantRequest & { id?: number } = this.emptyForm();

  constructor(private svc: TenantService, private planSvc: PlanService) {}

  ngOnInit() {
    this.load();
    this.planSvc.getAll().subscribe(r => this.plans.set(r));
  }

  load() {
    this.loading.set(true);
    this.svc.getAll(this.search, this.statusFilter, this.page(), this.pageSize).subscribe({
      next: (r) => {
        this.tenants.set(r.items);
        this.total.set(r.totalCount);
        this.totalPages.set(r.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 400);
  }
  onFilter() { this.page.set(1); this.load(); }
  goPage(p: number) { this.page.set(p); this.load(); }

  pageRange(): number[] {
    const total = this.totalPages();
    const cur = this.page();
    const start = Math.max(1, cur - 2);
    const end = Math.min(total, cur + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  min(a: number, b: number) { return Math.min(a, b); }

  statusLabel(s: TenantStatus): string {
    const m: Record<string, string> = {
      Active: 'Activo', Trial: 'Prueba', Suspended: 'Suspendido', Cancelled: 'Cancelado'
    };
    return m[s] ?? s;
  }

  openCreate() {
    this.form = this.emptyForm();
    this.editingTenant.set(null);
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(t: Tenant) {
    this.form = {
      ...this.emptyForm(),
      businessName: t.businessName,
      tradeName: t.tradeName,
      nit: t.nit,
      slug: t.slug,
      email: t.email,
      phone: t.phone,
      address: t.address,
      city: t.city,
      id: t.id
    };
    this.editingTenant.set(t);
    this.modalError.set('');
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    this.saving.set(true);
    this.modalError.set('');
    const editing = this.editingTenant();
    if (editing) {
      this.svc.update(editing.id, {
        businessName: this.form.businessName,
        tradeName: this.form.tradeName,
        email: this.form.email,
        phone: this.form.phone,
        address: this.form.address,
        city: this.form.city
      }).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.message || 'Error al guardar'); }
      });
    } else {
      this.svc.create(this.form).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.page.set(1); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.message || 'Error al crear'); }
      });
    }
  }

  changeStatus(t: Tenant, status: string) {
    const labels: Record<string, string> = { Suspended: 'suspender', Active: 'activar', Cancelled: 'cancelar' };
    if (!confirm(`¿Deseas ${labels[status] ?? status} "${t.businessName}"?`)) return;
    this.svc.changeStatus(t.id, status).subscribe({ next: () => this.load() });
  }

  private emptyForm(): CreateTenantRequest & { id?: number } {
    return {
      businessName: '', tradeName: null, nit: '', slug: '',
      email: '', phone: null, address: null, city: null,
      planId: 0, extraBranches: 0, billingCycle: 'Monthly',
      branchName: 'Sede Principal', branchAddress: null, branchCity: null, branchPhone: null,
      ownerEmail: '', ownerFullName: '', ownerPassword: '', ownerDocument: ''
    };
  }
}
