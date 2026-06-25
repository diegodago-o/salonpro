import { Component, computed, inject, signal } from '@angular/core';
import { colombiaEndOfDay, colombiaStartOfDay, todayColombia } from '../../core/utils/colombia-time';
import { CurrencyPipe, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { VentasService } from '../../core/services/ventas.service';
import { BranchService } from '../../core/services/branch.service';
import { Sale, SaleStatus, SaleItemDto, SalePaymentDto } from '../../core/models/ventas.models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

interface VentaGrupo {
  id: number;
  saleDateTime: string;
  clientName: string;
  clientDocument: string;
  clientDocumentType?: string;
  clientPhone?: string;
  clientEmail?: string;
  branchName?: string;
  paymentMethodName: string;
  stylistNames: string;
  grossServices: number;
  grossProducts: number;
  tipAmount: number;
  totalDeductions: number;
  grossTotal: number;
  stylistTotal: number;
  salonTotal: number;
  status: SaleStatus;
  voidedReason?: string;
  notes?: string;
  ventas: Sale[];
}

interface GrupoDetalle {
  stylistName: string;
  commissionPercent: number;
  items: SaleItemDto[];
  payments: SalePaymentDto[];
  sale: Sale;
}

interface VentaGrupoDetalle extends VentaGrupo {
  grupos: GrupoDetalle[];
  loadedItems: boolean;
}

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
  readonly mostrarModal  = signal(false);

  // Ahora el detalle es del grupo completo
  readonly ventaDetalleGrupo = signal<VentaGrupoDetalle | null>(null);

  // ── Logo del salón (para el recibo) ───────────────────
  readonly logoSalon = signal('');

  // ── Anular venta ──────────────────────────────────────
  readonly anulando          = signal(false);
  readonly ventaAAnular      = signal<VentaGrupo | null>(null);
  readonly razonAnulacion    = signal('');
  readonly guardandoAnulacion = signal(false);
  readonly errorAnulacion    = signal('');

  // ── Recibo ────────────────────────────────────────────
  readonly cargandoRecibo = signal<number | null>(null); // ID del grupo (primer folio) en carga

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

  // Ventas agrupadas por visita (mismo saleDateTime + clientDocument)
  readonly ventasAgrupadasFiltradas = computed(() =>
    this.agruparVentas(this.ventasFiltradas())
  );

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
  iniciarAnulacion(g: VentaGrupo): void {
    this.ventaAAnular.set(g);
    this.razonAnulacion.set('');
    this.errorAnulacion.set('');
    this.anulando.set(true);
  }

  cancelarAnulacion(): void {
    this.anulando.set(false);
    this.ventaAAnular.set(null);
  }

  confirmarAnulacion(): void {
    const g     = this.ventaAAnular();
    const razon = this.razonAnulacion().trim();
    if (!g || !razon) { this.errorAnulacion.set('Debes indicar el motivo de anulación.'); return; }
    this.guardandoAnulacion.set(true);
    forkJoin(g.ventas.map(v => this.ventasService.anularVenta(v.id, razon))).subscribe({
      next: () => {
        const ids = new Set(g.ventas.map(v => v.id));
        this.ventas.update(list =>
          list.map(x => ids.has(x.id) ? { ...x, status: 'Voided' as const, voidedReason: razon } : x)
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
  verRecibo(g: VentaGrupo): void {
    const todosConItems = g.ventas.every(v => v.items && v.payments);
    if (todosConItems) {
      this.imprimirReciboGrupo(g, g.ventas);
      return;
    }
    this.cargandoRecibo.set(g.id);
    forkJoin(g.ventas.map(v =>
      v.items ? of({ data: v }) : this.ventasService.getSaleDetail(v.id)
    )).subscribe({
      next: results => {
        const salesDetalle = results.map(r => r.data!);
        this.ventas.update(list => list.map(x => {
          const d = salesDetalle.find(s => s.id === x.id);
          return d ? d : x;
        }));
        this.cargandoRecibo.set(null);
        this.imprimirReciboGrupo(g, salesDetalle);
      },
      error: () => this.cargandoRecibo.set(null)
    });
  }

  imprimirReciboGrupo(g: VentaGrupo, salesDetalle: Sale[]): void {
    const fmt = (n: number) =>
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
    const fecha = new Date(g.saleDateTime).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

    const logoHtml = this.logoSalon()
      ? `<img src="${this.logoSalon()}" style="width:70px;height:70px;object-fit:contain;margin:0 auto 8px;display:block">`
      : '';

    // Secciones por estilista
    const secciones = salesDetalle.map(sale => {
      const items = (sale.items ?? [])
        .filter(i => i.type !== 'ProductInternal')
        .map(i => `<tr><td style="padding:2px 0">${i.name}</td><td style="text-align:right">${fmt(i.subtotal)}</td></tr>`)
        .join('');
      return items ? `<div style="font-size:10px;color:#666;margin:6px 0 2px">${sale.stylistName}</div><table>${items}</table>` : '';
    }).filter(Boolean).join('');

    const payments = salesDetalle[0]?.payments ?? [];
    const pagos = payments
      .map(p => `<tr><td style="padding:2px 0;color:#666">${p.paymentMethodName}</td><td style="text-align:right">${fmt(p.amount)}</td></tr>`)
      .join('');

    const docLine = g.clientDocument ? `<br><span style="color:#666">${g.clientDocumentType ?? 'Doc'}: ${g.clientDocument}</span>` : '';

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
<h2>${g.branchName ?? 'Salón'}</h2>
<div class="c" style="font-size:11px;color:#555;margin-bottom:8px">${fecha}</div>
<div class="d"></div>
<div style="font-size:12px;margin-bottom:6px"><strong>${g.clientName}</strong>${docLine}</div>
<div class="d"></div>
${secciones}
${g.tipAmount > 0 ? `<table><tr><td style="color:#666;padding:2px 0">Propina</td><td style="text-align:right">${fmt(g.tipAmount)}</td></tr></table>` : ''}
<div class="d"></div>
<table><tr class="tot"><td>TOTAL</td><td style="text-align:right">${fmt(g.grossTotal)}</td></tr></table>
<div class="d"></div>
<table>${pagos}</table>
<div class="d"></div>
<div class="c" style="font-size:10px;color:#888;margin-top:8px">¡Gracias por tu visita!</div>
<script>window.onload=()=>{window.print();window.close()}<\/script>
</body></html>`;

    const w = window.open('', '_blank', 'width:420,height:620');
    w?.document.write(html);
    w?.document.close();
  }

  cargar(): void {
    this.loading.set(true);
    const desde = this.filtroFechaDesde;
    const hasta = this.filtroFechaHasta;
    const branch = this.branchService.selectedBranch();
    this.ventasService.getVentas(
      desde ? colombiaStartOfDay(desde) : undefined,
      hasta ? colombiaEndOfDay(hasta)   : undefined,
      branch?.id,
      branch?.name
    ).subscribe(r => {
      this.ventas.set(r.data ?? []);
      this.loading.set(false);
    });
  }

  abrirDetalle(g: VentaGrupo): void {
    this.mostrarModal.set(true);
    // Mostrar datos básicos de inmediato
    this.ventaDetalleGrupo.set({
      ...g,
      grupos: g.ventas.map(v => ({
        stylistName: v.stylistName,
        commissionPercent: v.commissionPercent,
        items: v.items ?? [],
        payments: v.payments ?? [],
        sale: v,
      })),
      loadedItems: g.ventas.every(v => !!v.items),
    });

    // Cargar detalles si alguna venta no los tiene
    if (!g.ventas.every(v => v.items)) {
      this.loadingDetail.set(true);
      forkJoin(g.ventas.map(v =>
        v.items ? of({ data: v }) : this.ventasService.getSaleDetail(v.id)
      )).subscribe(results => {
        const salesDetalle = results.map(r => r.data!) as Sale[];
        // Cachear en la lista global
        this.ventas.update(list => list.map(x => {
          const d = salesDetalle.find(s => s.id === x.id);
          return d ? d : x;
        }));
        this.ventaDetalleGrupo.set({
          ...g,
          grupos: salesDetalle.map(v => ({
            stylistName: v.stylistName,
            commissionPercent: v.commissionPercent,
            items: v.items ?? [],
            payments: v.payments ?? [],
            sale: v,
          })),
          loadedItems: true,
        });
        this.loadingDetail.set(false);
      });
    }
  }

  cerrarDetalle(): void {
    this.mostrarModal.set(false);
    this.ventaDetalleGrupo.set(null);
  }

  private hoy(): string {
    return todayColombia();
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
      'Participación %':     v.commissionPercent,
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

  // Desglose de participaciones para una venta individual
  calcDesglose(sale: Sale): {
    name: string; isService: boolean; subtotal: number; commPct: number;
    hasFee: boolean; feePct: number; stylistAmt: number; salonAmt: number;
  }[] {
    if (!sale.items) return [];
    const grossAll = sale.grossServices + sale.grossProducts + sale.tipAmount;
    const sPct     = sale.commissionPercent / 100;

    return sale.items
      .filter(i => i.type !== 'ProductInternal')
      .map(item => {
        const subtotal = item.subtotal;
        const frac     = grossAll > 0 ? subtotal / grossAll : 0;
        const netBase  = Math.round(subtotal - sale.totalDeductions * frac);

        let stylistAmt: number, salonAmt: number, commPct: number;

        if (item.type === 'Service') {
          commPct = sPct;
          if (item.salonFeePercent > 0) {
            const fee  = Math.round(netBase * item.salonFeePercent / 100);
            const rem  = netBase - fee;
            stylistAmt = Math.round(rem * commPct);
            salonAmt   = Math.round(rem * (1 - commPct)) + fee;
          } else {
            stylistAmt = Math.round(netBase * commPct);
            salonAmt   = Math.round(netBase * (1 - commPct));
          }
        } else {
          commPct    = (item.stylistCommissionPercent ?? 0) / 100;
          stylistAmt = Math.round(netBase * commPct);
          salonAmt   = Math.round(netBase * (1 - commPct));
        }

        return {
          name:      item.name,
          isService: item.type === 'Service',
          subtotal,
          commPct:   Math.round((item.type === 'Service' ? sPct : commPct) * 100),
          hasFee:    item.type === 'Service' && item.salonFeePercent > 0,
          feePct:    item.salonFeePercent,
          stylistAmt,
          salonAmt,
        };
      });
  }

  calcNetTip(sale: Sale): number {
    if (!sale || sale.tipAmount === 0) return 0;
    const grossAll = sale.grossServices + sale.grossProducts + sale.tipAmount;
    const frac = grossAll > 0 ? sale.tipAmount / grossAll : 0;
    return Math.round(sale.tipAmount - sale.totalDeductions * frac);
  }

  // Agrupar ventas individuales por visita (mismo saleDateTime + clientDocument)
  private agruparVentas(ventas: Sale[]): VentaGrupo[] {
    const map = new Map<string, VentaGrupo>();
    for (const v of ventas) {
      const key = `${v.saleDateTime}|${v.clientDocument}`;
      if (map.has(key)) {
        const g = map.get(key)!;
        g.ventas.push(v);
        g.grossServices  += v.grossServices;
        g.grossProducts  += v.grossProducts;
        g.tipAmount      += v.tipAmount;
        g.totalDeductions += v.totalDeductions;
        g.grossTotal     += v.grossTotal;
        g.stylistTotal   += v.stylistTotal;
        g.salonTotal     += v.salonTotal;
        if (!g.stylistNames.includes(v.stylistName)) {
          g.stylistNames += `, ${v.stylistName}`;
        }
        if (v.voidedReason) g.voidedReason = v.voidedReason;
      } else {
        map.set(key, {
          id:               v.id,
          saleDateTime:     v.saleDateTime,
          clientName:       v.clientName,
          clientDocument:   v.clientDocument,
          clientDocumentType: v.clientDocumentType,
          clientPhone:      v.clientPhone,
          clientEmail:      v.clientEmail,
          branchName:       v.branchName,
          paymentMethodName: v.paymentMethodName,
          stylistNames:     v.stylistName,
          grossServices:    v.grossServices,
          grossProducts:    v.grossProducts,
          tipAmount:        v.tipAmount,
          totalDeductions:  v.totalDeductions,
          grossTotal:       v.grossTotal,
          stylistTotal:     v.stylistTotal,
          salonTotal:       v.salonTotal,
          status:           v.status,
          voidedReason:     v.voidedReason,
          notes:            v.notes,
          ventas:           [v],
        });
      }
    }
    // Calcular estado del grupo basado en el estado individual de cada venta
    const groups = Array.from(map.values());
    for (const g of groups) {
      const statuses = g.ventas.map(v => v.status);
      const anySettled  = statuses.some(s => s === 'Settled' || s === 'PartiallySettled');
      const anyActive   = statuses.some(s => s === 'Active');
      const allDone     = statuses.every(s => s === 'Settled' || s === 'Voided');
      const anyVoided   = statuses.some(s => s === 'Voided');

      if (allDone && statuses.some(s => s === 'Settled')) g.status = 'Settled';
      else if (anySettled && anyActive)                   g.status = 'PartiallySettled';
      else if (anyVoided && !anyActive && !anySettled)    g.status = 'Voided';
      // else: todas Active → status ya es 'Active' por defecto
    }
    return groups;
  }
}
