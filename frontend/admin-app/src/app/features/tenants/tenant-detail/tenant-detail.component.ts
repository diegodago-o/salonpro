import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '../../../core/services/tenant.service';
import { PlanService } from '../../../core/services/plan.service';
import { Tenant, TenantStatus, Branch, CreateBranchRequest, UpdateSubscriptionRequest } from '../../../core/models/tenant.model';
import { Plan } from '../../../core/models/plan.model';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="detail-page">

      <!-- Loading -->
      @if (loading()) {
        <div class="skeleton-header"></div>
        <div class="skeleton-grid">
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        </div>
      }

      @if (!loading() && tenant(); as t) {
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <button class="btn-back" (click)="goBack()">← Salones</button>
            <div>
              <div class="header-title">
                {{ t.businessName }}
                <span class="badge" [class]="'badge-' + t.status.toLowerCase()">
                  {{ statusLabel(t.status) }}
                </span>
              </div>
              @if (t.tradeName) {
                <div class="header-sub">{{ t.tradeName }}</div>
              }
            </div>
          </div>
          <div class="header-actions">
            @if (t.status !== 'Suspended' && t.status !== 'Cancelled') {
              <button class="btn-danger" (click)="changeStatus(t, 'Suspended')">🚫 Suspender</button>
            }
            @if (t.status === 'Suspended') {
              <button class="btn-success" (click)="changeStatus(t, 'Active')">✅ Activar</button>
            }
            <button class="btn-primary" (click)="openEdit(t)">✏️ Editar</button>
          </div>
        </div>

        <!-- Info + Subscription grid -->
        <div class="cards-grid">
          <!-- Tenant info -->
          <div class="info-card">
            <div class="card-title">📋 Información del salón</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">NIT</span>
                <span class="info-value">{{ t.nit }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Slug</span>
                <code class="slug">{{ t.slug }}.salonpro.com.co</code>
              </div>
              <div class="info-item">
                <span class="info-label">Correo</span>
                <span class="info-value">{{ t.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Teléfono</span>
                <span class="info-value">{{ t.phone ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Dirección</span>
                <span class="info-value">{{ t.address ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Ciudad</span>
                <span class="info-value">{{ t.city ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Registro</span>
                <span class="info-value">{{ t.createdAt | date:'dd/MM/yyyy' }}</span>
              </div>
              @if (t.trialEndsAt) {
                <div class="info-item">
                  <span class="info-label">Prueba hasta</span>
                  <span class="info-value warn">{{ t.trialEndsAt | date:'dd/MM/yyyy' }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Subscription -->
          <div class="info-card">
            <div class="card-title">💳 Suscripción</div>
            @if (t.subscription; as sub) {
              <div class="sub-plan-name">{{ sub.planName }}</div>
              <div class="sub-price">
                {{ sub.totalMonthly | currency:'COP':'symbol-narrow':'1.0-0' }}
                <span class="sub-period">/mes</span>
              </div>
              @if (sub.extraBranches > 0) {
                <div class="sub-extra">+ {{ sub.extraBranches }} sede(s) extra</div>
              }
              <div class="sub-details">
                <div class="sub-row">
                  <span class="sub-lbl">Ciclo</span>
                  <span>{{ sub.billingCycle === 'Monthly' ? 'Mensual' : 'Anual' }}</span>
                </div>
                <div class="sub-row">
                  <span class="sub-lbl">Estado</span>
                  <span class="badge" [class]="'badge-' + sub.status.toLowerCase()">{{ sub.status }}</span>
                </div>
                <div class="sub-row">
                  <span class="sub-lbl">Inicio</span>
                  <span>{{ sub.startDate | date:'dd/MM/yyyy' }}</span>
                </div>
                @if (sub.nextBillingDate) {
                  <div class="sub-row">
                    <span class="sub-lbl">Próx. cobro</span>
                    <span>{{ sub.nextBillingDate | date:'dd/MM/yyyy' }}</span>
                  </div>
                }
              </div>
              <button class="btn-outline btn-sm mt-16" (click)="openChangePlan(t, sub.planId)">
                🔄 Cambiar plan
              </button>
            } @else {
              <div class="no-data">Sin suscripción activa</div>
            }
          </div>
        </div>

        <!-- Branches -->
        <div class="branches-card">
          <div class="branches-header">
            <div class="card-title">🏢 Sedes ({{ branches().length }})</div>
            <button class="btn-primary btn-sm" (click)="openAddBranch()">+ Agregar sede</button>
          </div>

          @if (branchesLoading()) {
            <div class="loading-inline">Cargando sedes…</div>
          }

          @if (!branchesLoading() && branches().length === 0) {
            <div class="no-data">No hay sedes registradas</div>
          }

          @if (!branchesLoading() && branches().length > 0) {
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Ciudad</th>
                    <th>Dirección</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th>Registro</th>
                  </tr>
                </thead>
                <tbody>
                  @for (b of branches(); track b.id) {
                    <tr>
                      <td><strong>{{ b.name }}</strong></td>
                      <td>{{ b.city ?? '—' }}</td>
                      <td>{{ b.address ?? '—' }}</td>
                      <td>{{ b.phone ?? '—' }}</td>
                      <td>
                        <span class="badge" [class]="b.isActive ? 'badge-active' : 'badge-suspended'">
                          {{ b.isActive ? 'Activa' : 'Inactiva' }}
                        </span>
                      </td>
                      <td>{{ b.createdAt | date:'dd/MM/yyyy' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      @if (!loading() && !tenant()) {
        <div class="not-found">
          <span>⚠️ Salón no encontrado</span>
          <button class="btn-primary" (click)="goBack()">Volver</button>
        </div>
      }

      <!-- MODAL: Edit tenant -->
      @if (showEditModal()) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal modal-md" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Editar salón</h3>
              <button class="modal-close" (click)="closeModals()">×</button>
            </div>
            <div class="modal-body">
              @if (modalError()) { <div class="alert-error">{{ modalError() }}</div> }
              <div class="form-grid">
                <div class="field full"><label>Nombre del negocio *</label>
                  <input type="text" [(ngModel)]="editForm.businessName" /></div>
                <div class="field full"><label>Nombre comercial</label>
                  <input type="text" [(ngModel)]="editForm.tradeName" /></div>
                <div class="field"><label>Correo *</label>
                  <input type="email" [(ngModel)]="editForm.email" /></div>
                <div class="field"><label>Teléfono</label>
                  <input type="text" [(ngModel)]="editForm.phone" /></div>
                <div class="field full"><label>Dirección</label>
                  <input type="text" [(ngModel)]="editForm.address" /></div>
                <div class="field"><label>Ciudad</label>
                  <input type="text" [(ngModel)]="editForm.city" /></div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeModals()">Cancelar</button>
              <button class="btn-primary" (click)="saveEdit()" [disabled]="saving()">
                {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: Add branch -->
      @if (showBranchModal()) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Agregar sede</h3>
              <button class="modal-close" (click)="closeModals()">×</button>
            </div>
            <div class="modal-body">
              @if (modalError()) { <div class="alert-error">{{ modalError() }}</div> }
              <div class="form-grid">
                <div class="field full"><label>Nombre de la sede *</label>
                  <input type="text" [(ngModel)]="branchForm.name" placeholder="Sede Norte" /></div>
                <div class="field"><label>Ciudad</label>
                  <input type="text" [(ngModel)]="branchForm.city" /></div>
                <div class="field"><label>Teléfono</label>
                  <input type="text" [(ngModel)]="branchForm.phone" /></div>
                <div class="field full"><label>Dirección</label>
                  <input type="text" [(ngModel)]="branchForm.address" /></div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeModals()">Cancelar</button>
              <button class="btn-primary" (click)="saveBranch()" [disabled]="saving()">
                {{ saving() ? 'Guardando…' : 'Agregar sede' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: Change plan -->
      @if (showPlanModal()) {
        <div class="modal-backdrop" (click)="closeModals()">
          <div class="modal modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Cambiar plan</h3>
              <button class="modal-close" (click)="closeModals()">×</button>
            </div>
            <div class="modal-body">
              @if (modalError()) { <div class="alert-error">{{ modalError() }}</div> }
              <div class="form-grid">
                <div class="field full">
                  <label>Plan</label>
                  <select [(ngModel)]="subForm.planId">
                    @for (p of plans(); track p.id) {
                      <option [ngValue]="p.id">
                        {{ p.name }} — {{ p.priceMonthly | currency:'COP':'symbol-narrow':'1.0-0' }}/mes
                        ({{ p.maxBranches }} sede{{ p.maxBranches !== 1 ? 's' : '' }})
                      </option>
                    }
                  </select>
                </div>
                <div class="field">
                  <label>Sedes extra</label>
                  <input type="number" [(ngModel)]="subForm.extraBranches" min="0" />
                </div>
                <div class="field">
                  <label>Ciclo de facturación</label>
                  <select [(ngModel)]="subForm.billingCycle">
                    <option value="Monthly">Mensual</option>
                    <option value="Annual">Anual</option>
                  </select>
                </div>
              </div>
              <p class="plan-note">
                ⚠️ El cambio de plan afecta la facturación en el próximo ciclo.
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeModals()">Cancelar</button>
              <button class="btn-primary" (click)="savePlanChange()" [disabled]="saving()">
                {{ saving() ? 'Guardando…' : 'Confirmar cambio' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-page { max-width: 1200px; }

    /* Skeleton */
    .skeleton-header { height: 60px; background: #e5e7eb; border-radius: 10px; margin-bottom: 24px; animation: pulse 1.4s infinite; }
    .skeleton-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .skeleton-card { height: 280px; background: #e5e7eb; border-radius: 12px; animation: pulse 1.4s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

    /* Header */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
    }
    .header-left { display: flex; align-items: flex-start; gap: 16px; }
    .btn-back {
      background: #f3f4f6; border: none; padding: 8px 14px;
      border-radius: 8px; cursor: pointer; font-size: 14px;
      color: #374151; white-space: nowrap; margin-top: 4px;
    }
    .btn-back:hover { background: #e5e7eb; }
    .header-title {
      font-size: 24px; font-weight: 700; color: #1a1f2e;
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }
    .header-sub { color: #8892a4; font-size: 14px; margin-top: 4px; }
    .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }

    /* Cards grid */
    .cards-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 20px; margin-bottom: 20px;
    }
    @media (max-width: 900px) { .cards-grid { grid-template-columns: 1fr; } }

    .info-card {
      background: #fff; border-radius: 12px; padding: 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .card-title {
      font-size: 15px; font-weight: 700; color: #1a1f2e;
      margin-bottom: 18px; display: flex; align-items: center; gap: 8px;
    }

    /* Info grid */
    .info-grid { display: flex; flex-direction: column; gap: 12px; }
    .info-item { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .info-label { font-size: 13px; color: #8892a4; flex-shrink: 0; }
    .info-value { font-size: 14px; color: #1a1f2e; font-weight: 500; text-align: right; }
    .info-value.warn { color: #f59e0b; }
    .slug { background: #f3f4f6; padding: 2px 8px; border-radius: 6px; font-size: 12px; color: #6c63ff; }

    /* Subscription */
    .sub-plan-name { font-size: 22px; font-weight: 700; color: #1a1f2e; margin-bottom: 4px; }
    .sub-price { font-size: 30px; font-weight: 800; color: #6c63ff; line-height: 1; margin-bottom: 4px; }
    .sub-period { font-size: 16px; color: #8892a4; font-weight: 400; }
    .sub-extra { font-size: 13px; color: #8892a4; margin-bottom: 16px; }
    .sub-details { display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; }
    .sub-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
    .sub-lbl { color: #8892a4; font-size: 13px; }

    .no-data { color: #8892a4; font-size: 14px; padding: 16px 0; }
    .plan-note { font-size: 13px; color: #92400e; background: #fef3c7; padding: 10px 14px; border-radius: 8px; margin-top: 16px; }

    /* Branches */
    .branches-card {
      background: #fff; border-radius: 12px; padding: 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .branches-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
    .branches-header .card-title { margin-bottom: 0; }
    .loading-inline { color: #8892a4; font-size: 14px; padding: 12px 0; }

    /* Table */
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      text-align: left; font-size: 12px; font-weight: 600; color: #8892a4;
      text-transform: uppercase; letter-spacing: 0.04em;
      padding: 8px 12px; border-bottom: 2px solid #f3f4f6;
    }
    .data-table td { padding: 12px 12px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f9fafb; }

    /* Badges */
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-active    { background: #d1fae5; color: #065f46; }
    .badge-trial     { background: #fef3c7; color: #92400e; }
    .badge-suspended { background: #fee2e2; color: #991b1b; }
    .badge-cancelled { background: #f3f4f6; color: #6b7280; }
    .badge-main      { background: #ede9fe; color: #5b21b6; }
    .badge-secondary { background: #f3f4f6; color: #6b7280; }

    /* Buttons */
    .btn-primary {
      background: #6c63ff; color: #fff; border: none; padding: 9px 18px;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;
    }
    .btn-primary:hover:not(:disabled) { background: #5a52d5; }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
    .btn-secondary {
      background: #f3f4f6; color: #374151; border: none; padding: 9px 18px;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .btn-secondary:hover { background: #e5e7eb; }
    .btn-danger {
      background: #fee2e2; color: #b91c1c; border: none; padding: 9px 18px;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .btn-danger:hover { background: #fecaca; }
    .btn-success {
      background: #d1fae5; color: #065f46; border: none; padding: 9px 18px;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .btn-success:hover { background: #a7f3d0; }
    .btn-outline {
      background: none; border: 1.5px solid #6c63ff; color: #6c63ff; padding: 8px 16px;
      border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-outline:hover { background: #ede9fe; }
    .btn-sm { padding: 7px 14px; font-size: 13px; }
    .mt-16 { margin-top: 16px; display: block; }

    /* Not found */
    .not-found {
      display: flex; flex-direction: column; align-items: center; gap: 16px;
      padding: 80px 20px; color: #8892a4; font-size: 16px;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
    }
    .modal {
      background: #fff; border-radius: 16px; width: 100%;
      box-shadow: 0 24px 80px rgba(0,0,0,0.25);
      display: flex; flex-direction: column; max-height: 90vh;
    }
    .modal-md { max-width: 580px; }
    .modal-sm { max-width: 460px; }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid #f3f4f6;
    }
    .modal-header h3 { font-size: 18px; font-weight: 700; color: #1a1f2e; margin: 0; }
    .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #8892a4; }
    .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid #f3f4f6; display: flex; justify-content: flex-end; gap: 12px; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field.full { grid-column: span 2; }
    .field label { font-size: 13px; font-weight: 600; color: #374151; }
    .field input, .field select {
      padding: 9px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;
    }
    .field input:focus, .field select:focus { border-color: #6c63ff; }
    .alert-error {
      background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
      border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px;
    }
  `]
})
export class TenantDetailComponent implements OnInit {
  tenant = signal<Tenant | null>(null);
  branches = signal<Branch[]>([]);
  plans = signal<Plan[]>([]);
  loading = signal(true);
  branchesLoading = signal(true);

  showEditModal = signal(false);
  showBranchModal = signal(false);
  showPlanModal = signal(false);
  saving = signal(false);
  modalError = signal('');
  selectedPlanId = 0;
  subForm: UpdateSubscriptionRequest = { planId: 0, extraBranches: 0, billingCycle: 'Monthly' };

  editForm = { businessName: '', tradeName: <string | null>null, email: '', phone: <string | null>null, address: <string | null>null, city: <string | null>null };
  branchForm: CreateBranchRequest = { name: '', address: null, city: null, phone: null };

  private tenantId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: TenantService,
    private planSvc: PlanService
  ) {}

  ngOnInit() {
    this.tenantId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTenant();
    this.loadBranches();
    this.planSvc.getAll().subscribe(r => this.plans.set(r));
  }

  loadTenant() {
    this.loading.set(true);
    this.svc.getById(this.tenantId).subscribe({
      next: t => { this.tenant.set(t); this.loading.set(false); },
      error: () => { this.tenant.set(null); this.loading.set(false); }
    });
  }

  loadBranches() {
    this.branchesLoading.set(true);
    this.svc.getBranches(this.tenantId).subscribe({
      next: b => { this.branches.set(b); this.branchesLoading.set(false); },
      error: () => this.branchesLoading.set(false)
    });
  }

  goBack() { this.router.navigate(['/tenants']); }

  statusLabel(s: TenantStatus): string {
    const m: Record<string, string> = { Active: 'Activo', Trial: 'Prueba', Suspended: 'Suspendido', Cancelled: 'Cancelado' };
    return m[s] ?? s;
  }

  changeStatus(t: Tenant, status: string) {
    const label: Record<string, string> = { Suspended: 'suspender', Active: 'activar' };
    if (!confirm(`¿Deseas ${label[status]} "${t.businessName}"?`)) return;
    this.svc.changeStatus(t.id, status).subscribe({ next: () => this.loadTenant() });
  }

  openEdit(t: Tenant) {
    this.editForm = { businessName: t.businessName, tradeName: t.tradeName, email: t.email, phone: t.phone, address: t.address, city: t.city };
    this.modalError.set('');
    this.showEditModal.set(true);
  }

  saveEdit() {
    this.saving.set(true);
    this.modalError.set('');
    this.svc.update(this.tenantId, this.editForm).subscribe({
      next: () => { this.saving.set(false); this.closeModals(); this.loadTenant(); },
      error: err => { this.saving.set(false); this.modalError.set(err.error?.message || 'Error al guardar'); }
    });
  }

  openAddBranch() {
    this.branchForm = { name: '', address: null, city: null, phone: null };
    this.modalError.set('');
    this.showBranchModal.set(true);
  }

  saveBranch() {
    this.saving.set(true);
    this.modalError.set('');
    this.svc.createBranch(this.tenantId, this.branchForm).subscribe({
      next: () => { this.saving.set(false); this.closeModals(); this.loadBranches(); this.loadTenant(); },
      error: err => { this.saving.set(false); this.modalError.set(err.error?.message || 'Error al crear sede'); }
    });
  }

  openChangePlan(t: Tenant, currentPlanId: number) {
    const sub = t.subscription;
    this.subForm = {
      planId: currentPlanId,
      extraBranches: sub?.extraBranches ?? 0,
      billingCycle: sub?.billingCycle ?? 'Monthly'
    };
    this.modalError.set('');
    this.showPlanModal.set(true);
  }

  savePlanChange() {
    this.saving.set(true);
    this.modalError.set('');
    this.svc.updateSubscription(this.tenantId, this.subForm).subscribe({
      next: () => { this.saving.set(false); this.closeModals(); this.loadTenant(); },
      error: err => { this.saving.set(false); this.modalError.set(err.error?.message || 'Error al cambiar plan'); }
    });
  }

  closeModals() {
    this.showEditModal.set(false);
    this.showBranchModal.set(false);
    this.showPlanModal.set(false);
  }
}
