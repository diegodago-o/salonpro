import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanService } from '../../../core/services/plan.service';
import { Plan, CreatePlanRequest } from '../../../core/models/plan.model';

@Component({
  selector: 'app-plans-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="plans">
      <div class="page-header">
        <div>
          <h1 class="page-title">Planes</h1>
          <span class="page-subtitle">Gestión de planes de suscripción</span>
        </div>
        <button class="btn-primary" (click)="openCreate()">+ Nuevo plan</button>
      </div>

      @if (loading()) {
        <div class="loading-indicator">Cargando…</div>
      }

      @if (!loading()) {
        <div class="plans-grid">
          @for (p of plans(); track p.id) {
            <div class="plan-card" [class.inactive]="!p.isActive">
              <div class="plan-header">
                <div class="plan-badge" [class.active]="p.isActive" [class.inactive]="!p.isActive">
                  {{ p.isActive ? 'Activo' : 'Inactivo' }}
                </div>
                <div class="plan-actions">
                  <button class="btn-icon" (click)="openEdit(p)" title="Editar">✏️</button>
                </div>
              </div>
              <div class="plan-name">{{ p.name }}</div>
              <div class="plan-price">
                {{ p.priceMonthly | currency:'COP':'symbol-narrow':'1.0-0' }}
                <span class="plan-period">/mes</span>
              </div>
              <div class="plan-details">
                <div class="plan-detail">
                  <span class="detail-icon">🏢</span>
                  <span>{{ p.maxBranches }} sede{{ p.maxBranches !== 1 ? 's' : '' }} incluida{{ p.maxBranches !== 1 ? 's' : '' }}</span>
                </div>
                @if (p.pricePerExtra > 0) {
                  <div class="plan-detail">
                    <span class="detail-icon">➕</span>
                    <span>{{ p.pricePerExtra | currency:'COP':'symbol-narrow':'1.0-0' }} por sede extra</span>
                  </div>
                }
              </div>
              @if (p.features) {
                <div class="plan-features">
                  @for (f of parseFeatures(p.features); track f) {
                    <div class="feature-item">✓ {{ f }}</div>
                  }
                </div>
              }
            </div>
          }

          @if (plans().length === 0) {
            <div class="empty-state">
              <span class="empty-icon">📋</span>
              <p>No hay planes configurados</p>
            </div>
          }
        </div>
      }

      <!-- MODAL -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingPlan() ? 'Editar plan' : 'Nuevo plan' }}</h3>
              <button class="modal-close" (click)="closeModal()">×</button>
            </div>
            <div class="modal-body">
              @if (modalError()) {
                <div class="alert-error">{{ modalError() }}</div>
              }
              <div class="form-grid">
                <div class="field full">
                  <label>Nombre del plan *</label>
                  <input type="text" [(ngModel)]="form.name" placeholder="Básico, Estándar, Premium…" />
                </div>
                <div class="field">
                  <label>Precio mensual (COP) *</label>
                  <input type="number" [(ngModel)]="form.priceMonthly" min="0" placeholder="79000" />
                </div>
                <div class="field">
                  <label>Precio por sede extra (COP)</label>
                  <input type="number" [(ngModel)]="form.pricePerExtra" min="0" placeholder="0" />
                </div>
                <div class="field">
                  <label>Sedes incluidas *</label>
                  <input type="number" [(ngModel)]="form.maxBranches" min="1" placeholder="1" />
                </div>
                <div class="field full">
                  <label>Características (una por línea)</label>
                  <textarea
                    [(ngModel)]="featuresText"
                    rows="5"
                    placeholder="Gestión de citas&#10;Control de inventario&#10;Reportes básicos"
                    style="padding:9px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;outline:none;resize:vertical;"
                  ></textarea>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button class="btn-primary" (click)="save()" [disabled]="saving()">
                {{ saving() ? 'Guardando…' : (editingPlan() ? 'Guardar cambios' : 'Crear plan') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .plans { max-width: 1200px; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
    }
    .page-title { font-size: 26px; font-weight: 700; color: #1a1f2e; margin: 0 0 4px; }
    .page-subtitle { color: #8892a4; font-size: 14px; }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .plan-card {
      background: #fff; border-radius: 16px; padding: 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      border: 2px solid transparent;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .plan-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.1); border-color: #6c63ff; }
    .plan-card.inactive { opacity: 0.6; }

    .plan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .plan-badge {
      font-size: 11px; font-weight: 700; padding: 3px 10px;
      border-radius: 20px; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .plan-badge.active { background: #d1fae5; color: #065f46; }
    .plan-badge.inactive { background: #f3f4f6; color: #6b7280; }
    .plan-actions { display: flex; gap: 4px; }
    .btn-icon {
      background: none; border: 1px solid #e5e7eb; border-radius: 6px;
      padding: 4px 8px; cursor: pointer; font-size: 14px;
    }
    .btn-icon:hover { background: #f3f4f6; }

    .plan-name { font-size: 22px; font-weight: 700; color: #1a1f2e; margin-bottom: 8px; }
    .plan-price {
      font-size: 32px; font-weight: 800; color: #6c63ff; margin-bottom: 16px; line-height: 1;
    }
    .plan-period { font-size: 16px; color: #8892a4; font-weight: 400; }

    .plan-details { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .plan-detail { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; }
    .detail-icon { font-size: 16px; }

    .plan-features {
      border-top: 1px solid #f3f4f6; padding-top: 16px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .feature-item { font-size: 13px; color: #374151; }

    .loading-indicator { text-align: center; padding: 40px; color: #8892a4; }
    .empty-state { text-align: center; padding: 60px 20px; color: #8892a4; grid-column: span 3; }
    .empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }

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
      font-weight: 600; cursor: pointer;
    }
    .btn-secondary:hover { background: #e5e7eb; }

    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 20px;
    }
    .modal {
      background: #fff; border-radius: 16px; width: 100%;
      max-width: 520px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.25);
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid #f3f4f6;
    }
    .modal-header h3 { font-size: 18px; font-weight: 700; color: #1a1f2e; margin: 0; }
    .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #8892a4; }
    .modal-body { padding: 24px; }
    .modal-footer {
      padding: 16px 24px; border-top: 1px solid #f3f4f6;
      display: flex; justify-content: flex-end; gap: 12px;
    }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field.full { grid-column: span 2; }
    .field label { font-size: 13px; font-weight: 600; color: #374151; }
    .field input {
      padding: 9px 12px; border: 1.5px solid #e5e7eb;
      border-radius: 8px; font-size: 14px; outline: none;
    }
    .field input:focus { border-color: #6c63ff; }

    .alert-error {
      background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
      border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px;
    }
  `]
})
export class PlansListComponent implements OnInit {
  plans = signal<Plan[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingPlan = signal<Plan | null>(null);
  saving = signal(false);
  modalError = signal('');
  featuresText = '';

  form: CreatePlanRequest = this.emptyForm();

  constructor(private svc: PlanService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (r) => { this.plans.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  parseFeatures(f: string): string[] {
    try { return JSON.parse(f); } catch { return f.split('\n').filter(Boolean); }
  }

  openCreate() {
    this.form = this.emptyForm();
    this.featuresText = '';
    this.editingPlan.set(null);
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(p: Plan) {
    this.form = {
      name: p.name,
      maxBranches: p.maxBranches,
      priceMonthly: p.priceMonthly,
      pricePerExtra: p.pricePerExtra,
      features: p.features
    };
    this.featuresText = p.features ? this.parseFeatures(p.features).join('\n') : '';
    this.editingPlan.set(p);
    this.modalError.set('');
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    const features = this.featuresText.trim()
      ? JSON.stringify(this.featuresText.split('\n').map(s => s.trim()).filter(Boolean))
      : null;
    const payload: CreatePlanRequest = { ...this.form, features };

    this.saving.set(true);
    this.modalError.set('');
    const editing = this.editingPlan();
    const obs = editing
      ? this.svc.update(editing.id, payload)
      : this.svc.create(payload);

    obs.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: (err) => { this.saving.set(false); this.modalError.set(err.error?.message || 'Error al guardar'); }
    });
  }

  private emptyForm(): CreatePlanRequest {
    return { name: '', maxBranches: 1, priceMonthly: 0, pricePerExtra: 0, features: null };
  }
}
