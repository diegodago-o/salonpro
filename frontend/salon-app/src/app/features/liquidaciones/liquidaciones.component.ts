import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { LiquidacionesService } from '../../core/services/liquidaciones.service';
import { VentasService } from '../../core/services/ventas.service';
import { BranchService } from '../../core/services/branch.service';
import { LiquidacionDetalle, LiquidacionResumen } from '../../core/models/liquidaciones.models';
import { StylistOption } from '../../core/models/ventas.models';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Vista    = 'lista' | 'nueva' | 'detalle';
type Periodo  = 'hoy' | 'semana' | 'quincena' | 'mes' | 'personalizado';

interface PeriodoOpt { key: Periodo; label: string; }

@Component({
  selector: 'app-liquidaciones',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, IconComponent],
  templateUrl: './liquidaciones.component.html',
  styleUrl: './liquidaciones.component.scss'
})
export class LiquidacionesComponent implements OnInit {
  private readonly fb             = inject(FormBuilder);
  private readonly liqService     = inject(LiquidacionesService);
  private readonly ventasService  = inject(VentasService);
  private readonly branchService  = inject(BranchService);

  readonly vista         = signal<Vista>('lista');
  readonly liquidaciones = signal<LiquidacionResumen[]>([]);
  readonly detalle       = signal<LiquidacionDetalle | null>(null);
  readonly peluqueros    = signal<StylistOption[]>([]);
  readonly guardando     = signal(false);
  readonly cargando      = signal(true);
  readonly cargandoPeluqueros = signal(true);
  readonly msg           = signal<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── Período ───────────────────────────────────────────
  readonly periodo = signal<Periodo>('quincena');

  readonly periodos: PeriodoOpt[] = [
    { key: 'hoy',          label: 'Hoy'           },
    { key: 'semana',       label: 'Esta semana'    },
    { key: 'quincena',     label: 'Esta quincena'  },
    { key: 'mes',          label: 'Este mes'       },
    { key: 'personalizado',label: 'Personalizado'  },
  ];

  readonly rangoAutomatico = computed(() => {
    const hoy = new Date();
    const fmt  = (d: Date) => d.toISOString().split('T')[0];
    switch (this.periodo()) {
      case 'hoy':
        return { start: fmt(hoy), end: fmt(hoy) };
      case 'semana': {
        const lun = new Date(hoy);
        lun.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
        return { start: fmt(lun), end: fmt(hoy) };
      }
      case 'quincena': {
        const d = hoy.getDate();
        const y = hoy.getFullYear();
        const m = hoy.getMonth();
        if (d <= 15) {
          return { start: fmt(new Date(y, m, 1)), end: fmt(new Date(y, m, 15)) };
        } else {
          return { start: fmt(new Date(y, m, 16)), end: fmt(new Date(y, m + 1, 0)) };
        }
      }
      case 'mes': {
        const y = hoy.getFullYear();
        const m = hoy.getMonth();
        return { start: fmt(new Date(y, m, 1)), end: fmt(new Date(y, m + 1, 0)) };
      }
      default:
        return null; // personalizado: el usuario llena los campos
    }
  });

  // ── Formulario ────────────────────────────────────────
  readonly form = this.fb.group({
    stylistId: [null as number | null, Validators.required],
    startDate: ['', Validators.required],
    endDate:   ['', Validators.required],
  });

  // ── Computed lista ────────────────────────────────────
  readonly abiertas = computed(() => this.liquidaciones().filter(l => l.status === 'Open'));
  readonly cerradas = computed(() => this.liquidaciones().filter(l => l.status === 'Closed'));

  constructor() {
    toObservable(this.branchService.selectedBranch)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargar());
  }

  ngOnInit(): void {
    this.cargandoPeluqueros.set(true);
    this.ventasService.getPeluqueros(this.branchService.currentBranchId).subscribe({
      next: r => this.peluqueros.set(r.data ?? []),
      error: () => this.mostrarMsg('err', 'No se pudieron cargar los estilistas.'),
      complete: () => this.cargandoPeluqueros.set(false)
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    const branchId = this.branchService.currentBranchId;
    this.liqService.getLiquidaciones(branchId).subscribe({
      next: r => this.liquidaciones.set(r.data ?? []),
      error: () => this.mostrarMsg('err', 'Error al cargar liquidaciones.'),
      complete: () => this.cargando.set(false)
    });
  }

  // ── Navegación ────────────────────────────────────────
  abrirNueva(): void {
    this.periodo.set('quincena');
    this.form.reset();
    this.aplicarPeriodo('quincena');
    this.vista.set('nueva');
  }

  verDetalle(l: LiquidacionResumen): void {
    this.liqService.getDetalle(l.id).subscribe({
      next: r => { this.detalle.set(r.data); this.vista.set('detalle'); },
      error: () => {}
    });
  }

  volver(): void { this.vista.set('lista'); this.detalle.set(null); }

  // ── Selector de período ───────────────────────────────
  seleccionarPeriodo(p: Periodo): void {
    this.periodo.set(p);
    this.aplicarPeriodo(p);
  }

  private aplicarPeriodo(p: Periodo): void {
    const rango = this.rangoAutomatico();
    if (rango) {
      this.form.patchValue({ startDate: rango.start, endDate: rango.end });
    } else {
      this.form.patchValue({ startDate: '', endDate: '' });
    }
  }

  // ── CRUD ──────────────────────────────────────────────
  crear(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    const { stylistId, startDate, endDate } = this.form.value;
    const stylistName = this.peluqueros().find(p => p.id === stylistId)?.fullName ?? '';
    this.liqService.crearLiquidacion({
      stylistId: stylistId!, stylistName,
      startDate: startDate!, endDate: endDate!
    }, this.branchService.currentBranchId).subscribe({
      next: () => {
        this.cargar();
        this.mostrarMsg('ok', 'Liquidación creada');
        this.guardando.set(false);
        this.vista.set('lista');
      },
      error: () => { this.mostrarMsg('err', 'Error al crear.'); this.guardando.set(false); }
    });
  }

  cerrar(l: LiquidacionResumen | LiquidacionDetalle): void {
    if (!confirm(`¿Cerrar liquidación de ${l.stylistName}?`)) return;
    this.liqService.cerrarLiquidacion(l.id).subscribe({
      next: () => {
        this.cargar();
        if (this.detalle()?.id === l.id) this.volver();
        this.mostrarMsg('ok', 'Liquidación cerrada');
      },
      error: () => this.mostrarMsg('err', 'Error al cerrar.')
    });
  }

  private mostrarMsg(type: 'ok' | 'err', text: string): void {
    this.msg.set({ type, text });
    setTimeout(() => this.msg.set(null), 4000);
  }

  /** Parte izquierda de "Nombre · X% → $monto" */
  commLeft(item: string): string  { return item.split(' → ')[0] ?? item; }
  /** Parte derecha de "Nombre · X% → $monto" */
  commRight(item: string): string { return item.split(' → ')[1] ?? ''; }

  /** Nro total de ítems de servicio en todas las ventas de la liquidación */
  totalSvcItems(ventas: any[]): number {
    return ventas.reduce((s: number, v: any) => s + (v.serviceCommItems?.length ?? 0), 0);
  }
  /** Nro total de ítems de producto en todas las ventas de la liquidación */
  totalProdItems(ventas: any[]): number {
    return ventas.reduce((s: number, v: any) => s + (v.productCommItems?.length ?? 0), 0);
  }

  // ── PDF ───────────────────────────────────────────────
  exportarPDF(): void {
    const d = this.detalle();
    if (!d) return;

    const branch  = this.branchService.selectedBranch()?.name ?? 'Salón';
    const fmt     = (n: number) => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', minimumFractionDigits:0 }).format(n);
    const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' });
    const fmtDT   = (s: string) => new Date(s).toLocaleString('es-CO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    const now     = new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' });

    const periodStart = fmtDate(d.startDate + 'T00:00:00');
    const periodEnd   = fmtDate(d.endDate   + 'T00:00:00');

    // Filas de detalle por venta
    const ventasRows = d.ventas.map(v => {
      const allItems = [
        ...v.serviceCommItems.map(i => `<span style="display:block;font-size:10px;color:#6b7280;margin-top:2px">${i}</span>`),
        ...v.productCommItems.map(i => `<span style="display:block;font-size:10px;color:#6b7280;margin-top:2px">${i}</span>`),
      ].join('');
      const comm = fmt(v.commServices + v.commProducts + v.tip);
      const ded  = v.deduction > 0 ? `<span style="color:#dc2626">−${fmt(v.deduction)}</span>` : '—';
      return `
        <tr>
          <td>${fmtDT(v.saleDateTime)}</td>
          <td>${v.clientName}</td>
          <td>${v.paymentMethodsSummary}</td>
          <td class="r">${fmt(v.grossServices + v.grossProducts)}</td>
          <td class="r">${ded}</td>
          <td class="r" style="color:#4338ca;font-weight:600">${comm}${allItems}</td>
        </tr>`;
    }).join('');

    // Desglose del recibo
    const commSvcLine  = d.commServices > 0 ? `
      <tr><td style="color:#374151">Comisión servicios</td><td class="r">${fmt(d.commServices)}</td></tr>` : '';
    const commProdLine = d.commProducts > 0 ? `
      <tr><td style="color:#374151">Comisión productos</td><td class="r">${fmt(d.commProducts)}</td></tr>` : '';
    const tipsLine     = d.totalTips > 0 ? `
      <tr><td style="color:#374151">Propinas (neto)</td><td class="r">${fmt(d.totalTips)}</td></tr>` : '';
    const intConsLine  = d.internalConsumption > 0 ? `
      <tr><td style="color:#374151">(−) Consumo interno</td><td class="r" style="color:#dc2626">−${fmt(d.internalConsumption)}</td></tr>` : '';
    const anticLine    = d.anticiposAplicados > 0 ? `
      <tr><td style="color:#374151">(−) Anticipos aplicados</td><td class="r" style="color:#dc2626">−${fmt(d.anticiposAplicados)}</td></tr>` : '';

    const statusLabel  = d.status === 'Closed' ? 'Cerrada' : 'Abierta';
    const statusColor  = d.status === 'Closed' ? '#059669' : '#d97706';

    const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8">
<title>Liquidación · ${d.stylistName}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,sans-serif;font-size:11px;color:#111827;background:#fff;padding:28px 32px}
  /* Header */
  .hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:18px;border-bottom:2px solid #111827}
  .hd-left h1{font-size:22px;font-weight:700;letter-spacing:-.5px;margin-bottom:2px}
  .hd-left .sub{font-size:11px;color:#6b7280}
  .hd-right{text-align:right}
  .hd-right .salon{font-size:15px;font-weight:700;color:#111827}
  .hd-right .meta{font-size:10px;color:#9ca3af;margin-top:3px}
  /* Estilista badge */
  .stylist-box{display:flex;align-items:center;gap:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-bottom:20px}
  .stylist-avatar{width:40px;height:40px;border-radius:50%;background:#4338ca;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0}
  .stylist-name{font-size:15px;font-weight:700}
  .stylist-meta{font-size:10px;color:#6b7280;margin-top:2px}
  .status-badge{margin-left:auto;font-size:10px;font-weight:600;padding:4px 10px;border-radius:999px;border:1.5px solid ${statusColor};color:${statusColor}}
  /* KPIs */
  .kpis{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px}
  .kpi{padding:14px 16px;border-radius:8px;border:1px solid #e5e7eb}
  .kpi.dark{background:#111827;color:#fff;border-color:#111827}
  .kpi .lbl{font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:#9ca3af;margin-bottom:6px}
  .kpi.dark .lbl{color:#9ca3af}
  .kpi .val{font-size:20px;font-weight:700;letter-spacing:-.5px}
  /* Receipt */
  .receipt{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px}
  .receipt table{width:100%;border-collapse:collapse}
  .receipt td{padding:8px 14px;border-bottom:1px solid #f3f4f6;font-size:11px}
  .receipt tr:last-child td{border-bottom:none}
  .receipt .sep td{border-top:1px solid #d1d5db;border-bottom:1px solid #d1d5db;padding:4px 14px;background:#f9fafb}
  .receipt .total-row td{font-size:14px;font-weight:700;padding:12px 14px;background:#f9fafb;border-top:2px solid #111827}
  /* Ventas table */
  .section-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#9ca3af;margin-bottom:8px}
  table.ventas{width:100%;border-collapse:collapse;font-size:10px}
  table.ventas th{text-align:left;padding:7px 10px;border-bottom:2px solid #111827;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;white-space:nowrap}
  table.ventas td{padding:7px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top}
  table.ventas tr:hover td{background:#fafafa}
  .r{text-align:right}
  /* Firma */
  .firma{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb}
  .firma-line{border-top:1px solid #374151;padding-top:6px;font-size:10px;color:#374151;margin-top:32px}
  .firma-label{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;margin-top:3px}
  /* Print */
  @media print{
    body{padding:16px 20px}
    @page{size:A4;margin:15mm 18mm}
    .no-print{display:none}
  }
</style>
</head><body>

<!-- Header -->
<div class="hd">
  <div class="hd-left">
    <h1>Liquidación de comisiones</h1>
    <div class="sub">Período: ${periodStart} — ${periodEnd}</div>
  </div>
  <div class="hd-right">
    <div class="salon">${branch}</div>
    <div class="meta">Emitido: ${now}</div>
  </div>
</div>

<!-- Estilista -->
<div class="stylist-box">
  <div class="stylist-avatar">${d.stylistName.charAt(0).toUpperCase()}</div>
  <div>
    <div class="stylist-name">${d.stylistName}</div>
    <div class="stylist-meta">${d.totalVentas} servicio${d.totalVentas !== 1 ? 's' : ''} en el período</div>
  </div>
  <div class="status-badge">${statusLabel}</div>
</div>

<!-- KPIs -->
<div class="kpis">
  <div class="kpi">
    <div class="lbl">Total facturado</div>
    <div class="val">${fmt(d.grossServices + d.grossProducts)}</div>
  </div>
  <div class="kpi">
    <div class="lbl">Comisión + propinas</div>
    <div class="val">${fmt(d.commServices + d.commProducts + d.totalTips)}</div>
  </div>
  <div class="kpi dark">
    <div class="lbl">Neto a pagar</div>
    <div class="val">${fmt(d.netoPeluquero)}</div>
  </div>
</div>

<!-- Recibo de desglose -->
<div class="receipt">
  <table>
    <tr><td style="color:#374151">Facturado en período</td><td class="r">${fmt(d.grossServices + d.grossProducts)}</td></tr>
    ${commSvcLine}${commProdLine}${tipsLine}
    <tr class="sep"><td colspan="2"></td></tr>
    <tr><td style="color:#374151;font-weight:600">Total comisión + propinas</td><td class="r" style="font-weight:600">${fmt(d.commServices + d.commProducts + d.totalTips)}</td></tr>
    ${intConsLine}${anticLine}
    <tr class="total-row"><td>Neto a pagar</td><td class="r" style="color:#4338ca">${fmt(d.netoPeluquero)}</td></tr>
  </table>
</div>

<!-- Detalle de ventas -->
<div class="section-title">Detalle de ventas en el período</div>
<table class="ventas">
  <thead>
    <tr>
      <th>Fecha</th>
      <th>Cliente</th>
      <th>Método pago</th>
      <th class="r">Total</th>
      <th class="r">Deducción</th>
      <th class="r">Comisión</th>
    </tr>
  </thead>
  <tbody>
    ${ventasRows}
  </tbody>
</table>

<!-- Firma -->
<div class="firma">
  <div>
    <div class="firma-line"></div>
    <div class="firma-label">${d.stylistName} · Recibido conforme</div>
  </div>
  <div>
    <div class="firma-line"></div>
    <div class="firma-label">Administrador · ${branch}</div>
  </div>
</div>

<script>window.onload=()=>{window.print();}<\/script>
</body></html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    w?.document.write(html);
    w?.document.close();
  }
}
