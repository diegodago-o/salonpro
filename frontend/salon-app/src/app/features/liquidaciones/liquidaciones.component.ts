import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { LiquidacionesService } from '../../core/services/liquidaciones.service';
import { VentasService } from '../../core/services/ventas.service';
import { LiquidacionDetalle, LiquidacionResumen } from '../../core/models/liquidaciones.models';
import { StylistOption } from '../../core/models/ventas.models';

type Vista = 'lista' | 'nueva' | 'detalle';

@Component({
  selector: 'app-liquidaciones',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './liquidaciones.component.html',
  styleUrl: './liquidaciones.component.scss'
})
export class LiquidacionesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly liqService = inject(LiquidacionesService);
  private readonly ventasService = inject(VentasService);

  readonly vista = signal<Vista>('lista');
  readonly liquidaciones = signal<LiquidacionResumen[]>([]);
  readonly detalle = signal<LiquidacionDetalle | null>(null);
  readonly peluqueros = signal<StylistOption[]>([]);
  readonly guardando = signal(false);
  readonly msg = signal<{ type: 'ok' | 'err'; text: string } | null>(null);

  readonly abiertas = computed(() => this.liquidaciones().filter(l => l.status === 'Open'));
  readonly cerradas = computed(() => this.liquidaciones().filter(l => l.status === 'Closed'));

  readonly form = this.fb.group({
    stylistId: [null as number | null, Validators.required],
    startDate: ['', Validators.required],
    endDate:   ['', Validators.required],
  });

  ngOnInit(): void {
    this.cargar();
    this.ventasService.getPeluqueros().subscribe(r => this.peluqueros.set(r.data));
  }

  private cargar(): void {
    this.liqService.getLiquidaciones().subscribe(r => this.liquidaciones.set(r.data));
  }

  abrirNueva(): void {
    this.form.reset();
    this.vista.set('nueva');
  }

  verDetalle(l: LiquidacionResumen): void {
    this.liqService.getDetalle(l.id).subscribe(r => {
      this.detalle.set(r.data);
      this.vista.set('detalle');
    });
  }

  volver(): void { this.vista.set('lista'); this.detalle.set(null); }

  crear(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    const { stylistId, startDate, endDate } = this.form.value;
    const stylistName = this.peluqueros().find(p => p.id === stylistId)?.fullName ?? '';
    this.liqService.crearLiquidacion({ stylistId: stylistId!, stylistName, startDate: startDate!, endDate: endDate! }).subscribe({
      next: () => {
        this.cargar();
        this.mostrarMsg('ok', 'Liquidación creada');
        this.guardando.set(false);
        this.vista.set('lista');
      },
      error: () => { this.mostrarMsg('err', 'Error al crear.'); this.guardando.set(false); }
    });
  }

  cerrar(l: LiquidacionResumen): void {
    if (!confirm(`¿Cerrar liquidación de ${l.stylistName}?`)) return;
    this.liqService.cerrarLiquidacion(l.id).subscribe(() => {
      this.cargar();
      if (this.detalle()?.id === l.id) this.volver();
      this.mostrarMsg('ok', 'Liquidación cerrada');
    });
  }

  private mostrarMsg(type: 'ok' | 'err', text: string): void {
    this.msg.set({ type, text });
    setTimeout(() => this.msg.set(null), 4000);
  }
}
