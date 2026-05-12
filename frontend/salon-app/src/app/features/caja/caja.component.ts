import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CajaService } from '../../core/services/caja.service';
import { CashRegister } from '../../core/models/caja.models';
import { CurrencyPipe, DatePipe, NgTemplateOutlet } from '@angular/common';

type Vista = 'loading' | 'sin-caja' | 'caja-abierta' | 'cerrar-caja' | 'detalle-historial';

@Component({
  selector: 'app-caja',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, NgTemplateOutlet],
  templateUrl: './caja.component.html',
  styleUrl: './caja.component.scss'
})
export class CajaComponent implements OnInit {
  private readonly cajaService = inject(CajaService);
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

  ngOnInit(): void {
    this.cargarEstado();
  }

  private cargarEstado(): void {
    this.vista.set('loading');
    this.cajaService.getCajaActual().subscribe(res => {
      if (res.data) {
        this.cajaActual.set(res.data);
        this.vista.set('caja-abierta');
      } else {
        this.vista.set('sin-caja');
      }
      this.cargarHistorial();
    });
  }

  private cargarHistorial(): void {
    this.cajaService.getHistorial().subscribe(res => {
      this.historial.set(res.data);
    });
  }

  abrirCaja(): void {
    if (this.formAbrir.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.errorMsg.set(null);

    this.cajaService.abrirCaja({
      openingBalance: this.formAbrir.value.openingBalance!,
      notes: this.formAbrir.value.notes ?? undefined
    }).subscribe({
      next: res => {
        this.cajaActual.set(res.data);
        this.successMsg.set('Caja abierta correctamente');
        this.vista.set('caja-abierta');
        this.guardando.set(false);
        this.formAbrir.reset({ openingBalance: 0 });
        setTimeout(() => this.successMsg.set(null), 3000);
      },
      error: () => {
        this.errorMsg.set('Error al abrir la caja. Intenta de nuevo.');
        this.guardando.set(false);
      }
    });
  }

  irACerrarCaja(): void {
    this.vista.set('cerrar-caja');
    this.formCerrar.reset({ declaredCash: 0 });
    this.errorMsg.set(null);
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
        this.vista.set('detalle-historial');
        this.guardando.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al cerrar la caja. Intenta de nuevo.');
        this.guardando.set(false);
      }
    });
  }

  verDetalle(caja: CashRegister): void {
    this.cajaDetalle.set(caja);
    this.vista.set('detalle-historial');
  }

  volverAEstado(): void {
    this.cajaDetalle.set(null);
    this.vista.set(this.cajaActual() ? 'caja-abierta' : 'sin-caja');
  }

  cancelarCierre(): void {
    this.vista.set('caja-abierta');
    this.errorMsg.set(null);
  }

  get diferenciaColor(): string {
    const diff = this.cajaDetalle()?.difference ?? 0;
    if (diff > 0) return 'positivo';
    if (diff < 0) return 'negativo';
    return 'neutro';
  }

  totalVentas(caja: CashRegister): number {
    return caja.details.reduce((sum, d) => sum + d.totalAmount, 0);
  }

  totalDeducciones(caja: CashRegister): number {
    return caja.details.reduce((sum, d) => sum + d.totalDeductions, 0);
  }
}
