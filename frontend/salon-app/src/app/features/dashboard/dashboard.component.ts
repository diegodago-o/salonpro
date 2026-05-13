import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { VentasService } from '../../core/services/ventas.service';
import { BranchService } from '../../core/services/branch.service';
import { Sale } from '../../core/models/ventas.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, IconComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly ventasService = inject(VentasService);
  private readonly branchService = inject(BranchService);
  private readonly router = inject(Router);

  readonly user = this.authService.currentUser;
  readonly ventas = signal<Sale[]>([]);
  readonly today = new Date();

  readonly kpiHoy = computed(() => this.ventas().reduce((s, v) => s + v.grossTotal, 0));
  readonly ticketPromedio = computed(() => {
    const active = this.ventas().filter(v => v.status === 'Active');
    return active.length ? Math.round(this.kpiHoy() / active.length) : 0;
  });
  readonly ventasCount = computed(() => this.ventas().filter(v => v.status === 'Active').length);

  readonly helloName = computed(() => this.user()?.fullName?.split(' ')[0] ?? 'Usuario');

  readonly dayOfWeek = computed(() =>
    this.today.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  );

  constructor() {
    effect(() => {
      const branchId = this.branchService.selectedBranch()?.id;
      this.cargar(branchId);
    });
  }

  ngOnInit(): void { /* cargar se dispara desde el effect() */ }

  private cargar(branchId?: number): void {
    this.ventasService.getVentas(undefined, undefined, branchId).subscribe({
      next: r => { if (r.success && r.data) this.ventas.set(r.data); },
      error: () => {}
    });
  }

  irAlPOS(): void { this.router.navigate(['/ventas']); }
}
