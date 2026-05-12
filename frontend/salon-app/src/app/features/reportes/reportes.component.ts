import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { VentasService } from '../../core/services/ventas.service';
import { Sale } from '../../core/models/ventas.models';

@Component({
  selector: 'app-reportes',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ventasService = inject(VentasService);

  readonly ventas = signal<Sale[]>([]);
  readonly cargando = signal(false);

  readonly form = this.fb.group({
    desde: [this.fechaHoy()],
    hasta: [this.fechaHoy()],
  });

  // ── Métricas calculadas ───────────────────────────────
  readonly activas = computed(() => this.ventas().filter(v => v.status === 'Active'));

  readonly totalBruto = computed(() => this.activas().reduce((s, v) => s + v.grossTotal, 0));
  readonly totalDeduciones = computed(() => this.activas().reduce((s, v) => s + v.totalDeductions, 0));
  readonly totalSalon = computed(() => this.activas().reduce((s, v) => s + v.salonTotal, 0));
  readonly totalPeluqueros = computed(() => this.activas().reduce((s, v) => s + v.stylistTotal, 0));
  readonly totalPropinas = computed(() => this.activas().reduce((s, v) => s + v.tipAmount, 0));
  readonly countVentas = computed(() => this.activas().length);

  readonly porPeluquero = computed(() => {
    const mapa = new Map<string, { ventas: number; bruto: number; comision: number }>();
    for (const v of this.activas()) {
      const prev = mapa.get(v.stylistName) ?? { ventas: 0, bruto: 0, comision: 0 };
      mapa.set(v.stylistName, {
        ventas: prev.ventas + 1,
        bruto: prev.bruto + v.grossTotal,
        comision: prev.comision + v.stylistTotal,
      });
    }
    return [...mapa.entries()].map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.bruto - a.bruto);
  });

  readonly porMetodoPago = computed(() => {
    const mapa = new Map<string, { ventas: number; monto: number }>();
    for (const v of this.activas()) {
      const prev = mapa.get(v.paymentMethodName) ?? { ventas: 0, monto: 0 };
      mapa.set(v.paymentMethodName, { ventas: prev.ventas + 1, monto: prev.monto + v.grossTotal });
    }
    return [...mapa.entries()].map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.monto - a.monto);
  });

  ngOnInit(): void { this.buscar(); }

  buscar(): void {
    this.cargando.set(true);
    this.ventasService.getVentasHoy().subscribe(r => {
      this.ventas.set(r.data);
      this.cargando.set(false);
    });
  }

  private fechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }
}
