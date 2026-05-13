import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { VentasService } from '../../core/services/ventas.service';
import { Sale } from '../../core/models/ventas.models';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-mi-resumen',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './mi-resumen.component.html',
  styleUrl: './mi-resumen.component.scss'
})
export class MiResumenComponent implements OnInit {
  private readonly ventasService = inject(VentasService);
  private readonly authService = inject(AuthService);

  readonly ventas = signal<Sale[]>([]);
  readonly loading = signal(true);

  readonly helloName = computed(() => {
    const full = this.authService.currentUser()?.fullName ?? '';
    return full.split(' ')[0] || 'equipo';
  });

  readonly ventasHoy = computed(() =>
    this.ventas().filter(v => v.status === 'Active')
  );

  readonly comisionHoy = computed(() =>
    this.ventasHoy().reduce((s, v) => s + v.stylistTotal, 0)
  );

  readonly totalFacturadoHoy = computed(() =>
    this.ventasHoy().reduce((s, v) => s + v.grossTotal, 0)
  );

  readonly countHoy = computed(() => this.ventasHoy().length);

  ngOnInit(): void {
    this.ventasService.getVentasHoy().subscribe(r => {
      this.ventas.set(r.data);
      this.loading.set(false);
    });
  }
}
