import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { VentasService } from '../../core/services/ventas.service';
import { BranchService } from '../../core/services/branch.service';
import { Sale } from '../../core/models/ventas.models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, NgClass, FormsModule, IconComponent],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss'
})
export class HistorialComponent {
  private readonly ventasService = inject(VentasService);
  private readonly branchService = inject(BranchService);
  private readonly http          = inject(HttpClient);

  readonly ventas        = signal<Sale[]>([]);
  readonly loading       = signal(true);
  readonly loadingDetail = signal(false);
  readonly ventaDetalle  = signal<Sale | null>(null);
  readonly mostrarModal  = signal(false);

  // ── Logo del salón (para el recibo) ───────────────────
  readonly logoSalon = signal('');

  // ── Anular venta ──────────────────────────────────────
  readonly anulando          = signal(false);
  readonly ventaAAnular      = signal<Sale | null>(null);
  readonly razonAnulacion    = signal('');
  readonly guardandoAnulacion = signal(false);
  readonly errorAnulacion    = signal('');

  // ── Recibo ────────────────────────────────────────────
  readonly cargandoRecibo = signal<number | null>(null); // ID de la venta en carga

  // Filtros
  readonly filtroEstado     = signal('all');
  readonly filtroStylist    = signal('all');
  filtroFechaDesde = '';
  filtroFechaHasta = '';

  readonly stylists = computed(() =>
    [...new Set(this.ventas().map(v => v.stylistName))]
  );

  readonly ventasFiltradas = computed(() => {
    const estado   = this.filtroEstado();
    const stylist  = this.filtroStylist();
    return this.ventas().filter(v => {
      if (estado  !== 'all' && v.status     !== estado)  return false;
      if (stylist !== 'all' && v.stylistName !== stylist) return false;
      return true;
    });
  });

  readonly totales = computed(() => {
    const activas = this.ventasFiltradas().filter(v => v.status === 'Active');
    return {
      count:        activas.length,
      grossTotal:   activas.reduce((s, v) => s + v.grossTotal, 0),
      grossSvc:     activas.reduce((s, v) => s + v.grossServices, 0),
      grossProd:    activas.reduce((s, v) => s + v.grossProducts, 0),
      deducciones:  activas.reduce((s, v) => s + v.totalDeductions, 0),
      propinas:     activas.reduce((s, v) => s + v.tipAmount, 0),
      stylistTotal: activas.reduce((s, v) => s + v.stylistTotal, 0),
      salonTotal:   activas.reduce((s, v) => s + v.salonTotal, 0),
    };
  });

  constructor() {
    toObservable(this.branchService.selectedBranch)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargar());

    // Cargar logo del salón para los recibos
    this.http.get<any>(`${environment.apiUrl}/tenants/profile`).subscribe({
      next: r => { if (r?.data?.logoUrl) this.logoSalon.set(this.resolveLogo(r.data.logoUrl)); },
      error: () => {}
    });
  }

  // ── Helpers ──────────────────────────────────────────
  private resolveLogo(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('/')) return `${environment.apiUrl.replace(/\/api\/v\d+$/, '')}${url}`;
    if (url.startsWith('http://')) return url.replace('http://', 'https://');
    return url;
  }

  // ── Anular venta ─────────────────────────────────────
  iniciarAnulacion(v: Sale): void {
    this.ventaAAnular.set(v);
    this.razonAnulacion.set('');
    this.errorAnulacion.set('');
    this.anulando.set(true);
  }

  cancelarAnulacion(): void {
    this.anulando.set(false);
    this.ventaAAnular.set(null);
  }

  confirmarAnulacion(): void {
    const v     = this.ventaAAnular();
    const razon = this.razonAnulacion().trim();
    if (!v || !razon) { this.errorAnulacion.set('Debes indicar el motivo de anulación.'); return; }
    this.guardandoAnulacion.set(true);
    this.ventasService.anularVenta(v.id, razon).subscribe({
      next: () => {
        this.ventas.update(list =>
          list.map(x => x.id === v.id ? { ...x, status: 'Voided' as const, voidedReason: razon } : x)
        );
        this.guardandoAnulacion.set(false);
        this.cancelarAnulacion();
      },
      error: () => {
        this.errorAnulacion.set('Error al anular la venta. Intenta de nuevo.');
        this.guardandoAnulacion.set(false);
      }
    });
  }

  // ── Recibo ────────────────────────────────────────────
  verRecibo(v: Sale): void {
    // Si el detalle ya está cargado, imprimimos directo
    if (v.items && v.payments) { this.imprimirRecibo(v); return; }
    this.cargandoRecibo.set(v.id);
    this.ventasService.getSaleDetail(v.id).subscribe({
      next: r => {
        const detalle = r.data;
        // Cachear el detalle en la lista para futuros usos
        this.ventas.update(list => list.map(x => x.id === v.id ? detalle : x));
        this.cargandoRecibo.set(null);
        this.imprimirRecibo(detalle);
      },
      error: () => this.cargandoRecibo.set(null)
    });
  }

  imprimirRecibo(v: Sale): void {
    const fmt = (n: number) =>
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
    const fecha = new Date(v.saleDateTime).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

    const logoHtml = this.logoSalon()
      ? `<img src="${this.logoSalon()}" style="width:70px;height:70px;object-fit:contain;margin:0 auto 8px;display:block">`
      : '';

    const items = (v.items ?? [])
      .filter(i => i.type !== 'ProductInternal')
      .map(i => `<tr><td style="padding:2px 0">${i.name}</td><td style="text-align:right">${fmt(i.subtotal)}</td></tr>`)
      .join('');

    const pagos = (v.payments ?? [])
      .map(p => `<tr><td style="padding:2px 0;color:#666">${p.paymentMethodName}</td><td style="text-align:right">${fmt(p.amount)}</td></tr>`)
      .join('');

    const docLine = v.clientDocument ? `<br><span style="color:#666">${v.clientDocumentType ?? 'Doc'}: ${v.clientDocument}</span>` : '';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:12px;width:302px;padding:12px}
h2{font-size:14px;font-weight:bold;text-align:center;margin-bottom:4px}
.c{text-align:center}.d{border-top:1px dashed #000;margin:8px 0}
table{width:100%;border-collapse:collapse}td{vertical-align:top}
.tot td{font-weight:bold;font-size:13px;border-top:1px solid #000;padding-top:4px}
@media print{@page{margin:0}body{width:100%}}</style>
</head><body>
${logoHtml}
<h2>${v.branchName ?? 'Salón'}</h2>
<div class="c" style="font-size:11px;color:#555;margin-bottom:8px">${fecha}</div>
<div class="d"></div>
<div style="font-size:12px;margin-bottom:6px"><strong>${v.clientName}</strong>${docLine}</div>
<div class="d"></div>
<table>${items}</table>
${v.tipAmount > 0 ? `<table><tr><td style="color:#666;padding:2px 0">Propina</td><td style="text-align:right">${fmt(v.tipAmount)}</td></tr></table>` : ''}
<div class="d"></div>
<table><tr class="tot"><td>TOTAL</td><td style="text-align:right">${fmt(v.grossTotal)}</td></tr></table>
<div class="d"></div>
<table>${pagos}</table>
<div class="d"></div>
<div class="c" style="font-size:10px;color:#888;margin-top:8px">¡Gracias por tu visita!</div>
<script>window.onload=()=>{window.print();window.close()}<\/script>
</body></html>`;

    const w = window.open('', '_blank', 'width=420,height=620');
    w?.document.write(html);
    w?.document.close();
  }

  cargar(): void {
    this.loading.set(true);
    const desde = this.filtroFechaDesde;
    const hasta = this.filtroFechaHasta;
    const branch = this.branchService.selectedBranch();
    this.ventasService.getVentas(
      desde ? new Date(desde + 'T00:00:00').toISOString() : undefined,
      hasta ? new Date(hasta + 'T23:59:59').toISOString() : undefined,
      branch?.id,
      branch?.name
    ).subscribe(r => {
      this.ventas.set(r.data ?? []);
      this.loading.set(false);
    });
  }

  abrirDetalle(v: Sale): void {
    this.mostrarModal.set(true);
    this.ventaDetalle.set(v);         // muestra datos básicos inmediatamente
    if (!v.items) {
      this.loadingDetail.set(true);
      this.ventasService.getSaleDetail(v.id).subscribe(r => {
        this.ventaDetalle.set(r.data);
        this.loadingDetail.set(false);
      });
    }
  }

  cerrarDetalle(): void {
    this.mostrarModal.set(false);
    this.ventaDetalle.set(null);
  }

  private hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }

  filtrarHoy(): void {
    this.filtroFechaDesde = this.hoy();
    this.filtroFechaHasta = this.hoy();
    this.cargar();
  }

  verTodas(): void {
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.cargar();
  }

  descargarExcel(): void {
    const ventas = this.ventasFiltradas();
    if (!ventas.length) return;

    const rows = ventas.map(v => ({
      'Folio':          v.id,
      'Fecha':          new Date(v.saleDateTime).toLocaleString('es-CO'),
      'Sede':           v.branchName ?? '',
      'Estilista':      v.stylistName,
      'Comisión %':     v.commissionPercent,
      'Cliente':        v.clientName,
      'Documento':      v.clientDocument,
      'Tipo doc.':      v.clientDocumentType ?? '',
      'Teléfono':       v.clientPhone ?? '',
      'Método pago':    v.paymentMethodName,
      'Servicios':      v.grossServices,
      'Productos':      v.grossProducts,
      'Propina':        v.tipAmount,
      'Deducciones':    v.totalDeductions,
      'Total bruto':    v.grossTotal,
      'Est. total':     v.stylistTotal,
      'Salón total':    v.salonTotal,
      'Estado':         v.status === 'Active' ? 'Activa' : 'Anulada',
      'Motivo anul.':   v.voidedReason ?? '',
      'Notas':          v.notes ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');

    const fecha = this.hoy();
    XLSX.writeFile(wb, `historial-ventas-${fecha}.xlsx`);
  }

  itemTypeLabel(type: string): string {
    return type === 'Service' ? 'Servicio' :
           type === 'ProductSale' ? 'Producto venta' : 'Consumo interno';
  }

  itemTypePill(type: string): string {
    return type === 'Service' ? 'pill-info' :
           type === 'ProductSale' ? 'pill-success' : 'pill-warning';
  }

  /** Comisión estimada del estilista sobre servicios */
  comisionEstilista(v: Sale): number {
    if (!v.items) return v.stylistTotal;
    const baseServicios = v.grossServices - (v.totalDeductions * (v.grossServices / Math.max(v.grossTotal, 1)));
    const feesSalon = (v.items ?? [])
      .filter(i => i.type === 'Service' && i.salonFeePercent > 0)
      .reduce((s, i) => s + Math.round(i.subtotal * i.salonFeePercent / 100), 0);
    return Math.round((baseServicios - feesSalon) * v.commissionPercent / 100);
  }
}
