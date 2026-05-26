import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { VentasService } from '../../core/services/ventas.service';
import { BranchService } from '../../core/services/branch.service';
import { LiquidacionesService } from '../../core/services/liquidaciones.service';
import { Sale } from '../../core/models/ventas.models';
import { LiquidacionResumen } from '../../core/models/liquidaciones.models';
import { colombiaEndOfDay, colombiaStartOfDay, todayColombia } from '../../core/utils/colombia-time';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, IconComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private readonly authService         = inject(AuthService);
  private readonly ventasService       = inject(VentasService);
  private readonly branchService       = inject(BranchService);
  private readonly liquidacionesService = inject(LiquidacionesService);
  private readonly router              = inject(Router);

  readonly user    = this.authService.currentUser;
  readonly today   = new Date();
  readonly loading = signal(true);

  // ── Datos crudos ─────────────────────────────────────
  readonly ventasHoy  = signal<Sale[]>([]);
  readonly ventasMes  = signal<Sale[]>([]);
  readonly liquidaciones = signal<LiquidacionResumen[]>([]);

  // ── HOY (Active + Settled — excluye solo Voided) ─────
  // Una venta liquidada sigue siendo ingreso real del día
  readonly ventasHoyValidas = computed(() =>
    this.ventasHoy().filter(v => v.status !== 'Voided'));

  readonly kpiHoy = computed(() =>
    this.ventasHoyValidas().reduce((s, v) => s + v.grossTotal, 0));

  readonly salonHoy = computed(() =>
    this.ventasHoyValidas().reduce((s, v) => s + v.salonTotal, 0));

  readonly countHoy = computed(() => this.ventasHoyValidas().length);

  readonly ticketPromedio = computed(() =>
    this.countHoy() ? Math.round(this.kpiHoy() / this.countHoy()) : 0);

  // ── SEMANA (lunes → hoy, sin Voided) ─────────────────
  readonly ventasSemanales = computed(() => {
    const hoyStr = todayColombia();
    const [y, mo, d] = hoyStr.split('-').map(Number);
    const dow      = new Date(y, mo - 1, d).getDay();
    const daysBack = (dow + 6) % 7;
    const lunesTs  = new Date(y, mo - 1, d - daysBack).getTime();
    return this.ventasMes()
      .filter(v => v.status !== 'Voided' && new Date(v.saleDateTime).getTime() >= lunesTs);
  });

  readonly kpiSemana   = computed(() =>
    this.ventasSemanales().reduce((s, v) => s + v.grossTotal, 0));
  readonly countSemana = computed(() => this.ventasSemanales().length);

  // ── MES (sin Voided) ─────────────────────────────────
  readonly ventasMesValidas = computed(() =>
    this.ventasMes().filter(v => v.status !== 'Voided'));

  readonly kpiMes   = computed(() =>
    this.ventasMesValidas().reduce((s, v) => s + v.grossTotal, 0));
  readonly countMes = computed(() => this.ventasMesValidas().length);

  // ── LIQUIDACIONES ABIERTAS ───────────────────────────
  readonly liquidacionesAbiertas = computed(() =>
    this.liquidaciones().filter(l => l.status === 'Open'));

  // ── MÉTODOS DE PAGO HOY ──────────────────────────────
  readonly pagosSummary = computed(() => {
    const map = new Map<string, number>();
    for (const v of this.ventasHoyValidas()) {
      map.set(v.paymentMethodName, (map.get(v.paymentMethodName) ?? 0) + v.grossTotal);
    }
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  });

  // ── TOP ESTILISTAS HOY ───────────────────────────────
  readonly topEstilistas = computed(() => {
    const map = new Map<string, { ventas: number; total: number; salonTotal: number }>();
    for (const v of this.ventasHoyValidas()) {
      const e = map.get(v.stylistName) ?? { ventas: 0, total: 0, salonTotal: 0 };
      e.ventas++;
      e.total      += v.grossTotal;
      e.salonTotal += v.salonTotal;
      map.set(v.stylistName, e);
    }
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  });

  readonly helloName = computed(() =>
    this.user()?.fullName?.split(' ')[0] ?? 'Usuario');

  constructor() {
    toObservable(this.branchService.selectedBranch)
      .pipe(takeUntilDestroyed())
      .subscribe(branch => this.cargar(branch?.id, branch?.name));
  }

  private cargar(branchId?: number, branchName?: string): void {
    this.loading.set(true);

    const hoy  = todayColombia();                      // "YYYY-MM-DD" hora Colombia
    const [y, mo] = hoy.split('-').map(Number);
    const pad  = (n: number) => String(n).padStart(2, '0');
    const fromMes = `${y}-${pad(mo)}-01T00:00:00`;    // 1ro del mes, sin offset

    forkJoin({
      hoy: this.ventasService.getVentas(
        colombiaStartOfDay(hoy), colombiaEndOfDay(hoy), branchId, branchName),
      mes: this.ventasService.getVentas(
        fromMes, colombiaEndOfDay(hoy), branchId, branchName),
      liq: this.liquidacionesService.getLiquidaciones(branchId),
    }).subscribe({
      next: ({ hoy, mes, liq }) => {
        this.ventasHoy.set(hoy.data  ?? []);
        this.ventasMes.set(mes.data  ?? []);
        this.liquidaciones.set(liq.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  irAlPOS(): void { this.router.navigate(['/ventas']); }

  statusLabel(status: string): string {
    return status === 'Active'  ? 'Activa'
         : status === 'Voided'  ? 'Anulada'
         : status === 'Settled' ? 'Liquidada'
         : status;
  }

  statusPill(status: string): string {
    return status === 'Active'  ? 'pill-success'
         : status === 'Voided'  ? 'pill-danger'
         : status === 'Settled' ? 'pill-info'
         : '';
  }
}
