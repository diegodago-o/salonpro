import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../core/services/dashboard.service';
import { Dashboard } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <span class="page-subtitle">Resumen de la plataforma</span>
      </div>

      @if (loading()) {
        <div class="loading-grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="kpi-skeleton"></div>
          }
        </div>
      }

      @if (data(); as d) {
        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon" style="background:#e0edff;color:#3b82f6">🏪</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ d.totalTenants }}</div>
              <div class="kpi-label">Total Salones</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" style="background:#d1fae5;color:#10b981">✅</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ d.activeTenants }}</div>
              <div class="kpi-label">Activos</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" style="background:#fef3c7;color:#f59e0b">⏳</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ d.trialTenants }}</div>
              <div class="kpi-label">En prueba</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" style="background:#fee2e2;color:#ef4444">🚫</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ d.suspendedTenants }}</div>
              <div class="kpi-label">Suspendidos</div>
            </div>
          </div>
          <div class="kpi-card kpi-highlight">
            <div class="kpi-icon" style="background:#ede9fe;color:#6c63ff">💰</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ d.mrr | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
              <div class="kpi-label">MRR (Ingresos mensuales)</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon" style="background:#fce7f3;color:#ec4899">📅</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ d.totalTenants - d.suspendedTenants }}</div>
              <div class="kpi-label">Con suscripción activa</div>
            </div>
          </div>
        </div>

        <!-- Recent tenants -->
        @if (d.recentTenants && d.recentTenants.length) {
          <div class="section">
            <h2 class="section-title">Salones recientes</h2>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Salón</th>
                    <th>Slug</th>
                    <th>Plan</th>
                    <th>Estado</th>
                    <th>Registro</th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of d.recentTenants; track t.id) {
                    <tr>
                      <td>{{ t.businessName }}</td>
                      <td><code class="slug">{{ t.slug }}</code></td>
                      <td>{{ t.planName }}</td>
                      <td><span class="badge" [class]="'badge-' + t.status.toLowerCase()">{{ statusLabel(t.status) }}</span></td>
                      <td>{{ t.createdAt | date:'dd/MM/yyyy' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }

      @if (error()) {
        <div class="alert-error">
          ⚠️ No se pudo cargar el dashboard. <button (click)="load()">Reintentar</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1200px; }

    .page-header { margin-bottom: 28px; }
    .page-title { font-size: 26px; font-weight: 700; color: #1a1f2e; margin: 0 0 4px; }
    .page-subtitle { color: #8892a4; font-size: 14px; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .kpi-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .kpi-highlight { grid-column: span 2; }
    .kpi-icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; flex-shrink: 0;
    }
    .kpi-value { font-size: 26px; font-weight: 700; color: #1a1f2e; line-height: 1; }
    .kpi-label { font-size: 12px; color: #8892a4; margin-top: 4px; }

    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px; margin-bottom: 32px;
    }
    .kpi-skeleton {
      height: 88px; background: #e5e7eb;
      border-radius: 12px;
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

    .section { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .section-title { font-size: 16px; font-weight: 700; color: #1a1f2e; margin: 0 0 16px; }

    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      text-align: left; font-size: 12px; font-weight: 600;
      color: #8892a4; text-transform: uppercase; letter-spacing: 0.04em;
      padding: 8px 12px; border-bottom: 2px solid #f3f4f6;
    }
    .data-table td {
      padding: 12px 12px; font-size: 14px; color: #374151;
      border-bottom: 1px solid #f3f4f6;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f9fafb; }

    .slug { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; }

    .badge {
      display: inline-block; padding: 3px 10px;
      border-radius: 20px; font-size: 12px; font-weight: 600;
    }
    .badge-active    { background: #d1fae5; color: #065f46; }
    .badge-trial     { background: #fef3c7; color: #92400e; }
    .badge-suspended { background: #fee2e2; color: #991b1b; }
    .badge-cancelled { background: #f3f4f6; color: #6b7280; }

    .alert-error {
      background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
      border-radius: 10px; padding: 16px 20px; font-size: 14px;
      display: flex; align-items: center; gap: 12px;
    }
    .alert-error button {
      background: #ef4444; color: #fff; border: none; border-radius: 6px;
      padding: 6px 14px; cursor: pointer; font-size: 13px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  data = signal<Dashboard | null>(null);
  loading = signal(true);
  error = signal(false);

  constructor(private svc: DashboardService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.svc.get().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); }
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      Active: 'Activo', Trial: 'Prueba',
      Suspended: 'Suspendido', Cancelled: 'Cancelado'
    };
    return map[status] ?? status;
  }
}
