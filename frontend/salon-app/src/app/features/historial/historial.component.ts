import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { VentasService } from '../../core/services/ventas.service';
import { Sale } from '../../core/models/ventas.models';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, IconComponent],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss'
})
export class HistorialComponent implements OnInit {
  private readonly ventasService = inject(VentasService);

  readonly ventas = signal<Sale[]>([]);
  readonly loading = signal(true);
  readonly ventaSeleccionada = signal<Sale | null>(null);

  readonly filtroEstado = signal('all');
  readonly filtroStylist = signal('all');

  readonly stylists = computed(() => {
    const names = [...new Set(this.ventas().map(v => v.stylistName))];
    return names;
  });

  readonly ventasFiltradas = computed(() => {
    const estado = this.filtroEstado();
    const stylist = this.filtroStylist();
    return this.ventas().filter(v => {
      if (estado !== 'all' && v.status !== estado) return false;
      if (stylist !== 'all' && v.stylistName !== stylist) return false;
      return true;
    });
  });

  readonly totalFiltrado = computed(() =>
    this.ventasFiltradas()
      .filter(v => v.status === 'Active')
      .reduce((s, v) => s + v.grossTotal, 0)
  );

  ngOnInit(): void {
    this.ventasService.getVentasHoy().subscribe(r => {
      this.ventas.set(r.data);
      this.loading.set(false);
    });
  }

  abrirDetalle(v: Sale): void { this.ventaSeleccionada.set(v); }
  cerrarDetalle(): void { this.ventaSeleccionada.set(null); }
}
