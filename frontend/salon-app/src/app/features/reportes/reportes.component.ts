import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentasService } from '../../core/services/ventas.service';
import { BranchService } from '../../core/services/branch.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Sale } from '../../core/models/ventas.models';
import { colombiaStartOfDay, colombiaEndOfDay, todayColombia } from '../../core/utils/colombia-time';

export type Tab      = 'resumen' | 'ventas' | 'estilistas' | 'pagos' | 'clientes' | 'diario' | 'servicios' | 'propinas' | 'deducciones' | 'horarios';
export type Periodo  = 'hoy' | 'semana' | 'mes' | 'mes-anterior' | 'custom';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, FormsModule, IconComponent],
  templateUrl: './reportes.component.html',
  styleUrl:    './reportes.component.scss'
})
export class ReportesComponent {
  private readonly ventasService = inject(VentasService);
  private readonly branchService = inject(BranchService);

  // ── Estado UI ──────────────────────────────────────────
  readonly tabActiva      = signal<Tab>('resumen');
  readonly periodo        = signal<Periodo>('mes');
  readonly loading        = signal(false);
  readonly ventas         = signal<Sale[]>([]);
  readonly filtroEstilista = signal('');
  readonly filtroCliente   = signal('');
  readonly filtroStatus    = signal('todos');

  // Rango personalizado (two-way binding con ngModel)
  fechaDesde = '';
  fechaHasta = '';

  // Metadatos de las tabs
  readonly TABS: { v: Tab; l: string }[] = [
    { v: 'resumen',     l: 'Resumen'              },
    { v: 'ventas',      l: 'Ventas'               },
    { v: 'estilistas',  l: 'Por estilista'        },
    { v: 'pagos',       l: 'Métodos de pago'      },
    { v: 'clientes',    l: 'Por cliente'          },
    { v: 'diario',      l: 'Por día'              },
    { v: 'servicios',   l: 'Servicios vs Productos'},
    { v: 'propinas',    l: 'Propinas'             },
    { v: 'deducciones', l: 'Deducciones'          },
    { v: 'horarios',    l: 'Horarios pico'        },
  ];

  // ── Período computado ──────────────────────────────────
  readonly rango = computed(() => this.calcRango(this.periodo()));

  private calcRango(p: Periodo): { from: string; to: string; label: string } {
    const hoy = todayColombia();
    const [y, mo, d] = hoy.split('-').map(Number);
    const pad = (n: number) => String(n).padStart(2, '0');

    switch (p) {
      case 'hoy':
        return { from: hoy, to: hoy, label: 'Hoy' };
      case 'semana': {
        const dow      = new Date(y, mo - 1, d).getDay();
        const daysBack = (dow + 6) % 7;
        const lunes    = new Date(y, mo - 1, d - daysBack);
        const from     = `${lunes.getFullYear()}-${pad(lunes.getMonth() + 1)}-${pad(lunes.getDate())}`;
        return { from, to: hoy, label: 'Esta semana' };
      }
      case 'mes':
        return { from: `${y}-${pad(mo)}-01`, to: hoy, label: 'Este mes' };
      case 'mes-anterior': {
        const moAnt = mo === 1 ? 12 : mo - 1;
        const yAnt  = mo === 1 ? y - 1 : y;
        const lastD = new Date(y, mo - 1, 0).getDate();
        return {
          from: `${yAnt}-${pad(moAnt)}-01`,
          to:   `${yAnt}-${pad(moAnt)}-${pad(lastD)}`,
          label: 'Mes anterior'
        };
      }
      case 'custom':
        return {
          from: this.fechaDesde || hoy,
          to:   this.fechaHasta || hoy,
          label: 'Personalizado'
        };
    }
  }

  // ── Base: excluye Voided para cálculos financieros ────
  readonly ventasValidas = computed(() =>
    this.ventas().filter(v => v.status !== 'Voided'));

  // ── Tab Ventas (con filtros de estado y estilista) ─────
  readonly ventasTabFiltradas = computed(() => {
    let lista = this.filtroStatus() === 'activas'
      ? this.ventas().filter(v => v.status !== 'Voided')
      : this.filtroStatus() === 'anuladas'
        ? this.ventas().filter(v => v.status === 'Voided')
        : this.ventas();
    const f = this.filtroEstilista().toLowerCase();
    if (f) lista = lista.filter(v => v.stylistName.toLowerCase().includes(f));
    return lista;
  });

  // ── KPIs globales del período ──────────────────────────
  readonly kpiTotal    = computed(() => this.ventasValidas().reduce((s, v) => s + v.grossTotal, 0));
  readonly kpiSalon    = computed(() => this.ventasValidas().reduce((s, v) => s + v.salonTotal, 0));
  readonly kpiEstil    = computed(() => this.ventasValidas().reduce((s, v) => s + v.stylistTotal, 0));
  readonly kpiDeduc    = computed(() => this.ventasValidas().reduce((s, v) => s + v.totalDeductions, 0));
  readonly kpiPropinas = computed(() => this.ventasValidas().reduce((s, v) => s + v.tipAmount, 0));
  readonly kpiServ     = computed(() => this.ventasValidas().reduce((s, v) => s + v.grossServices, 0));
  readonly kpiProd     = computed(() => this.ventasValidas().reduce((s, v) => s + v.grossProducts, 0));
  readonly kpiCount    = computed(() => this.ventasValidas().length);
  readonly kpiAnuladas = computed(() => this.ventas().filter(v => v.status === 'Voided').length);
  readonly kpiTicket   = computed(() =>
    this.kpiCount() ? Math.round(this.kpiTotal() / this.kpiCount()) : 0);

  // ── Por estilista ──────────────────────────────────────
  readonly porEstilista = computed(() => {
    const map = new Map<string, { ventas: number; bruto: number; salon: number; estil: number; propinas: number }>();
    for (const v of this.ventasValidas()) {
      const e = map.get(v.stylistName) ?? { ventas: 0, bruto: 0, salon: 0, estil: 0, propinas: 0 };
      e.ventas++; e.bruto += v.grossTotal; e.salon += v.salonTotal;
      e.estil += v.stylistTotal; e.propinas += v.tipAmount;
      map.set(v.stylistName, e);
    }
    return [...map.entries()]
      .map(([name, d]) => ({ name, ...d, ticket: d.ventas ? Math.round(d.bruto / d.ventas) : 0 }))
      .sort((a, b) => b.bruto - a.bruto);
  });

  // ── Por método de pago ─────────────────────────────────
  readonly porPago = computed(() => {
    const map = new Map<string, { count: number; total: number; deduc: number }>();
    for (const v of this.ventasValidas()) {
      const e = map.get(v.paymentMethodName) ?? { count: 0, total: 0, deduc: 0 };
      e.count++; e.total += v.grossTotal; e.deduc += v.totalDeductions;
      map.set(v.paymentMethodName, e);
    }
    return [...map.entries()]
      .map(([name, d]) => ({
        name, ...d,
        neto: d.total - d.deduc,
        pct:  d.total ? Math.round(d.deduc / d.total * 1000) / 10 : 0
      }))
      .sort((a, b) => b.total - a.total);
  });

  // ── Por cliente ────────────────────────────────────────
  readonly porCliente = computed(() => {
    const map = new Map<string, { doc: string; visitas: number; total: number; propinas: number }>();
    for (const v of this.ventasValidas()) {
      const e = map.get(v.clientName) ?? { doc: v.clientDocument ?? '', visitas: 0, total: 0, propinas: 0 };
      e.visitas++; e.total += v.grossTotal; e.propinas += v.tipAmount;
      map.set(v.clientName, e);
    }
    const f = this.filtroCliente().toLowerCase();
    return [...map.entries()]
      .map(([name, d]) => ({ name, ...d, ticket: d.visitas ? Math.round(d.total / d.visitas) : 0 }))
      .filter(c => !f || c.name.toLowerCase().includes(f) || c.doc.includes(f))
      .sort((a, b) => b.total - a.total);
  });

  // ── Por día ────────────────────────────────────────────
  readonly porDia = computed(() => {
    const map = new Map<string, { ventas: number; bruto: number; salon: number; estil: number; anuladas: number }>();
    for (const v of this.ventas()) {
      const dia = v.saleDateTime.slice(0, 10);
      const e = map.get(dia) ?? { ventas: 0, bruto: 0, salon: 0, estil: 0, anuladas: 0 };
      if (v.status !== 'Voided') {
        e.ventas++; e.bruto += v.grossTotal; e.salon += v.salonTotal; e.estil += v.stylistTotal;
      } else {
        e.anuladas++;
      }
      map.set(dia, e);
    }
    return [...map.entries()]
      .map(([dia, d]) => ({ dia, ...d, ticket: d.ventas ? Math.round(d.bruto / d.ventas) : 0 }))
      .sort((a, b) => b.dia.localeCompare(a.dia));
  });

  // ── Servicios vs Productos (global) ───────────────────
  readonly mixIngreso = computed(() => {
    let services = 0, products = 0, tips = 0, internal = 0;
    for (const v of this.ventasValidas()) {
      services += v.grossServices;
      products += v.grossProducts;
      tips     += v.tipAmount;
      internal += v.internalConsumption;
    }
    const total = services + products + tips;
    return {
      services, products, tips, internal, total,
      pctServ: total ? Math.round(services / total * 100) : 0,
      pctProd: total ? Math.round(products / total * 100) : 0,
      pctTips: total ? Math.round(tips / total * 100) : 0,
    };
  });

  // ── Servicios vs Productos por estilista ───────────────
  readonly mixPorEstilista = computed(() => {
    const map = new Map<string, { services: number; products: number; tips: number; ventas: number }>();
    for (const v of this.ventasValidas()) {
      const e = map.get(v.stylistName) ?? { services: 0, products: 0, tips: 0, ventas: 0 };
      e.services += v.grossServices; e.products += v.grossProducts;
      e.tips += v.tipAmount; e.ventas++;
      map.set(v.stylistName, e);
    }
    return [...map.entries()]
      .map(([name, d]) => {
        const total = d.services + d.products + d.tips;
        return {
          name, ...d, total,
          pctServ: total ? Math.round(d.services / total * 100) : 0,
          pctProd: total ? Math.round(d.products / total * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  });

  // ── Propinas ───────────────────────────────────────────
  readonly propinas = computed(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const v of this.ventasValidas()) {
      if (v.tipAmount <= 0) continue;
      const e = map.get(v.stylistName) ?? { count: 0, total: 0 };
      e.count++; e.total += v.tipAmount;
      map.set(v.stylistName, e);
    }
    return [...map.entries()]
      .map(([name, d]) => ({ name, ...d, promedio: Math.round(d.total / d.count) }))
      .sort((a, b) => b.total - a.total);
  });

  readonly totalPropinasCount = computed(() =>
    this.propinas().reduce((s, p) => s + p.count, 0));

  // ── Deducciones ────────────────────────────────────────
  readonly deducciones = computed(() => {
    const map = new Map<string, { count: number; bruto: number; deduc: number }>();
    for (const v of this.ventasValidas()) {
      if (v.totalDeductions <= 0) continue;
      const e = map.get(v.paymentMethodName) ?? { count: 0, bruto: 0, deduc: 0 };
      e.count++; e.bruto += v.grossTotal; e.deduc += v.totalDeductions;
      map.set(v.paymentMethodName, e);
    }
    return [...map.entries()]
      .map(([name, d]) => ({
        name, ...d,
        neto: d.bruto - d.deduc,
        pct:  d.bruto ? Math.round(d.deduc / d.bruto * 1000) / 10 : 0
      }))
      .sort((a, b) => b.deduc - a.deduc);
  });

  readonly totalDeducBruto  = computed(() => this.deducciones().reduce((s, d) => s + d.bruto, 0));
  readonly totalDeducCount  = computed(() => this.deducciones().reduce((s, d) => s + d.count, 0));

  // ── Horarios pico ──────────────────────────────────────
  readonly horariosPico = computed(() => {
    const counts: number[] = new Array(24).fill(0);
    const totals: number[] = new Array(24).fill(0);

    for (const v of this.ventasValidas()) {
      // saleDateTime viene con offset -05:00 → convertir a Colombia
      const dt  = new Date(v.saleDateTime);
      const h   = (dt.getUTCHours() - 5 + 24) % 24;
      counts[h] += 1;
      totals[h] += v.grossTotal;
    }

    const maxCount = Math.max(...counts, 1);
    return Array.from({ length: 15 }, (_, i) => i + 7).map(h => ({
      h,
      label: h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`,
      count: counts[h],
      total: totals[h],
      pct:   Math.round(counts[h] / maxCount * 100),
    }));
  });

  // ── Cycle ─────────────────────────────────────────────
  constructor() {
    toObservable(this.branchService.selectedBranch)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargar());
  }

  cargar(): void {
    const { from, to } = this.rango();
    const branch       = this.branchService.selectedBranch();
    this.loading.set(true);
    this.ventasService.getVentas(
      colombiaStartOfDay(from), colombiaEndOfDay(to), branch?.id, branch?.name
    ).subscribe({
      next:  r => { this.ventas.set(r.data ?? []); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  cambiarPeriodo(p: Periodo): void {
    this.periodo.set(p);
    if (p !== 'custom') this.cargar();
  }

  aplicarFechas(): void {
    if (this.fechaDesde && this.fechaHasta) {
      this.periodo.set('custom');
      this.cargar();
    }
  }

  // ── Helpers ────────────────────────────────────────────
  sumArr(arr: any[], key: string): number {
    return arr.reduce((s: number, row: any) => s + (row[key] as number), 0);
  }

  statusLabel(s: string): string {
    return s === 'Active'  ? 'Activa'
         : s === 'Voided'  ? 'Anulada'
         : s === 'Settled' ? 'Liquidada'
         : s;
  }

  statusPill(s: string): string {
    return s === 'Active'  ? 'pill-success'
         : s === 'Voided'  ? 'pill-danger'
         : s === 'Settled' ? 'pill-info'
         : '';
  }

  // ── Exportar CSV (adapta al tab activo) ───────────────
  exportarCSV(): void {
    const sep = ';';
    let headers: string[];
    let rows: (string | number)[][];
    const tab = this.tabActiva();

    switch (tab) {
      case 'ventas':
        headers = ['Fecha', 'Hora', 'Estilista', 'Cliente', 'Documento',
                   'Método pago', 'Servicios', 'Productos', 'Propina',
                   'Total bruto', 'Salón', 'Estilista total', 'Deducciones', 'Estado'];
        rows = this.ventasTabFiltradas().map(v => {
          const dt  = new Date(v.saleDateTime);
          const hh  = ((dt.getUTCHours() - 5 + 24) % 24).toString().padStart(2, '0');
          const mm  = dt.getUTCMinutes().toString().padStart(2, '0');
          return [
            v.saleDateTime.slice(0, 10), `${hh}:${mm}`,
            `"${v.stylistName}"`, `"${v.clientName}"`, v.clientDocument ?? '',
            v.paymentMethodName, v.grossServices, v.grossProducts, v.tipAmount,
            v.grossTotal, v.salonTotal, v.stylistTotal, v.totalDeductions, v.status
          ];
        });
        break;

      case 'estilistas':
        headers = ['Estilista', 'Ventas', 'Total bruto', 'Para salón', 'Para estilista', 'Propinas', 'Ticket promedio'];
        rows = this.porEstilista().map(e =>
          [`"${e.name}"`, e.ventas, e.bruto, e.salon, e.estil, e.propinas, e.ticket]);
        break;

      case 'pagos':
        headers = ['Método de pago', 'Ventas', 'Total bruto', 'Deducciones', 'Neto', '% deducción'];
        rows = this.porPago().map(p =>
          [p.name, p.count, p.total, p.deduc, p.neto, p.pct]);
        break;

      case 'clientes':
        headers = ['Cliente', 'Documento', 'Visitas', 'Total gastado', 'Propinas', 'Ticket promedio'];
        rows = this.porCliente().map(c =>
          [`"${c.name}"`, c.doc, c.visitas, c.total, c.propinas, c.ticket]);
        break;

      case 'diario':
        headers = ['Fecha', 'Ventas', 'Total bruto', 'Para salón', 'Para estilistas', 'Ticket promedio', 'Anuladas'];
        rows = this.porDia().map(d =>
          [d.dia, d.ventas, d.bruto, d.salon, d.estil, d.ticket, d.anuladas]);
        break;

      case 'servicios':
        headers = ['Estilista', 'Ventas', 'Servicios', 'Productos', 'Propinas', 'Total', '% Servicios', '% Productos'];
        rows = this.mixPorEstilista().map(e =>
          [`"${e.name}"`, e.ventas, e.services, e.products, e.tips, e.total, e.pctServ, e.pctProd]);
        break;

      case 'propinas':
        headers = ['Estilista', 'Ventas con propina', 'Total propinas', 'Promedio'];
        rows = this.propinas().map(p =>
          [`"${p.name}"`, p.count, p.total, p.promedio]);
        break;

      case 'deducciones':
        headers = ['Método de pago', 'Ventas afectadas', 'Total bruto', 'Total deducción', 'Neto real', '% efectivo'];
        rows = this.deducciones().map(d =>
          [d.name, d.count, d.bruto, d.deduc, d.neto, d.pct]);
        break;

      case 'horarios':
        headers = ['Hora', 'Ventas', 'Total recaudado'];
        rows = this.horariosPico().filter(h => h.count > 0).map(h =>
          [h.label, h.count, h.total]);
        break;

      default: return;
    }

    const csv  = '﻿' + [headers.join(sep), ...rows.map(r => r.join(sep))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `reporte_${tab}_${this.rango().from}_${this.rango().to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
