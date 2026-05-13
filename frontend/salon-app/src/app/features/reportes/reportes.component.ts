import { Component, inject, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { VentasService } from '../../core/services/ventas.service';
import { BranchService } from '../../core/services/branch.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Sale } from '../../core/models/ventas.models';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CurrencyPipe, IconComponent],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent {
  private readonly ventasService = inject(VentasService);
  private readonly branchService = inject(BranchService);
  readonly ventas = signal<Sale[]>([]);

  readonly totalMes = () => this.ventas().reduce((s, v) => s + v.grossTotal, 0);
  readonly totalDeducciones = () => this.ventas().reduce((s, v) => s + v.totalDeductions, 0);
  readonly countActivas = () => this.ventas().filter(v => v.status === 'Active').length;

  constructor() {
    toObservable(this.branchService.selectedBranch)
      .pipe(takeUntilDestroyed())
      .subscribe(branch => {
        this.ventasService.getVentas(undefined, undefined, branch?.id).subscribe(r => {
          if (r.success && r.data) this.ventas.set(r.data);
        });
      });
  }

  getStylistStats(): { name: string; total: number; pct: number }[] {
    const map = new Map<string, number>();
    this.ventas().filter(v => v.status === 'Active').forEach(v => {
      map.set(v.stylistName, (map.get(v.stylistName) ?? 0) + v.grossTotal);
    });
    const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const max = entries[0]?.[1] ?? 1;
    return entries.map(([name, total]) => ({ name, total, pct: Math.round(total / max * 100) }));
  }
}
