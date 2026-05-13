import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentasService } from '../../core/services/ventas.service';
import { Sale } from '../../core/models/ventas.models';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, NgClass, FormsModule, IconComponent],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss'
})
export class HistorialComponent implements OnInit {
  private readonly ventasService = inject(VentasService);

  readonly ventas       = signal<Sale[]>([]);
  readonly loading      = signal(true);
  readonly loadingDetail = signal(false);
  readonly ventaDetalle = signal<Sale | null>(null);
  readonly mostrarModal = signal(false);

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

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    const desde = this.filtroFechaDesde;
    const hasta = this.filtroFechaHasta;
    this.ventasService.getVentas(
      desde ? new Date(desde + 'T00:00:00').toISOString() : undefined,
      hasta ? new Date(hasta + 'T23:59:59').toISOString() : undefined
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
