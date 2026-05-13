import { Component, inject, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { CajaService } from '../../core/services/caja.service';
import { BranchService } from '../../core/services/branch.service';
import { CashRegister } from '../../core/models/caja.models';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Vista = 'loading' | 'sin-caja' | 'caja-abierta' | 'cerrar-caja' | 'detalle';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, IconComponent],
  templateUrl: './caja.component.html',
  styleUrl: './caja.component.scss'
})
export class CajaComponent {
  private readonly cajaService = inject(CajaService);
  private readonly branchService = inject(BranchService);
  private readonly fb = inject(FormBuilder);

  readonly vista = signal<Vista>('loading');
  readonly cajaActual = signal<CashRegister | null>(null);
  readonly historial = signal<CashRegister[]>([]);
  readonly cajaDetalle = signal<CashRegister | null>(null);
  readonly guardando = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);

  readonly formAbrir = this.fb.group({
    openingBalance: [0, [Validators.required, Validators.min(0)]],
    notes: ['']
  });

  readonly formCerrar = this.fb.group({
    declaredCash: [0, [Validators.required, Validators.min(0)]],
    notes: ['']
  });

  get expectedCash(): number {
    const caja = this.cajaActual();
    if (!caja) return 0;
    const efectivo = caja.details.find(d => d.paymentMethodName === 'Efectivo')?.totalAmount ?? 0;
    return efectivo + caja.openingBalance;
  }

  get diff(): number {
    return (this.formCerrar.value.declaredCash ?? 0) - this.expectedCash;
  }

  constructor() {
    toObservable(this.branchService.selectedBranch)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargarEstado());
  }

  private cargarEstado(): void {
    const branchId = this.branchService.currentBranchId;
    this.vista.set('loading');
    this.cajaService.getCajaActual(branchId).subscribe(res => {
      if (res.success && res.data) {
        this.cajaActual.set(res.data);
        this.vista.set('caja-abierta');
      } else {
        this.vista.set('sin-caja');
      }
      this.cargarHistorial();
    });
  }

  private cargarHistorial(): void {
    const branchId = this.branchService.currentBranchId;
    this.cajaService.getHistorial(branchId).subscribe(res => {
      if (res.success && res.data) this.historial.set(res.data);
    });
  }

  abrirCaja(): void {
    if (this.formAbrir.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.errorMsg.set(null);
    const branch = this.branchService.selectedBranch();
    this.cajaService.abrirCaja({
      openingBalance: this.formAbrir.value.openingBalance!,
      notes: this.formAbrir.value.notes ?? undefined
    }, branch?.id, branch?.name).subscribe({
      next: res => {
        this.cajaActual.set(res.data);
        this.successMsg.set('Caja abierta correctamente');
        this.vista.set('caja-abierta');
        this.guardando.set(false);
        this.cargarHistorial();
        setTimeout(() => this.successMsg.set(null), 3000);
      },
      error: () => { this.errorMsg.set('Error al abrir la caja.'); this.guardando.set(false); }
    });
  }

  cerrarCaja(): void {
    if (this.formCerrar.invalid || this.guardando() || !this.cajaActual()) return;
    this.guardando.set(true);
    this.errorMsg.set(null);
    this.cajaService.cerrarCaja(this.cajaActual()!.id, {
      declaredCash: this.formCerrar.value.declaredCash!,
      notes: this.formCerrar.value.notes ?? undefined
    }).subscribe({
      next: res => {
        this.cajaDetalle.set(res.data);
        this.cajaActual.set(null);
        this.cargarHistorial();
        this.vista.set('detalle');
        this.guardando.set(false);
      },
      error: () => { this.errorMsg.set('Error al cerrar la caja.'); this.guardando.set(false); }
    });
  }

  irACerrar(): void { this.vista.set('cerrar-caja'); this.formCerrar.reset({ declaredCash: 0 }); this.errorMsg.set(null); }
  cancelarCierre(): void { this.vista.set('caja-abierta'); this.errorMsg.set(null); }
  verDetalle(caja: CashRegister): void { this.cajaDetalle.set(caja); this.vista.set('detalle'); }
  volverAEstado(): void { this.cajaDetalle.set(null); this.vista.set(this.cajaActual() ? 'caja-abierta' : 'sin-caja'); }

  totalVentas(caja: CashRegister): number { return caja.details.reduce((s, d) => s + d.totalAmount, 0); }
  totalDeducciones(caja: CashRegister): number { return caja.details.reduce((s, d) => s + d.totalDeductions, 0); }
}
