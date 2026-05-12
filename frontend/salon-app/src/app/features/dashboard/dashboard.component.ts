import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CajaService } from '../../core/services/caja.service';
import { VentasService } from '../../core/services/ventas.service';
import { Sale } from '../../core/models/ventas.models';
import { CashRegister } from '../../core/models/caja.models';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly cajaService = inject(CajaService);
  private readonly ventasService = inject(VentasService);

  readonly user = this.auth.currentUser;
  readonly cargando = signal(true);
  readonly caja = signal<CashRegister | null>(null);
  readonly ventas = signal<Sale[]>([]);

  readonly totalBruto = computed(() =>
    this.ventas().filter(v => v.status === 'Active').reduce((s, v) => s + v.grossTotal, 0)
  );
  readonly totalSalon = computed(() =>
    this.ventas().filter(v => v.status === 'Active').reduce((s, v) => s + v.salonTotal, 0)
  );
  readonly totalPeluqueros = computed(() =>
    this.ventas().filter(v => v.status === 'Active').reduce((s, v) => s + v.stylistTotal, 0)
  );
  readonly countActivas = computed(() => this.ventas().filter(v => v.status === 'Active').length);
  readonly ultimasVentas = computed(() => this.ventas().slice(0, 5));

  readonly saludo = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  });

  readonly esPropietario = computed(() => this.user()?.role === 'TenantOwner');

  ngOnInit(): void {
    this.cajaService.getCajaActual().subscribe(r => this.caja.set(r.data));
    this.ventasService.getVentasHoy().subscribe(r => {
      this.ventas.set(r.data);
      this.cargando.set(false);
    });
  }
}
