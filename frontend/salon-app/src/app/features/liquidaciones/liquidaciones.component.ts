import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { LiquidacionesService } from '../../core/services/liquidaciones.service';
import { VentasService } from '../../core/services/ventas.service';
import { BranchService } from '../../core/services/branch.service';
import { LiquidacionDetalle, LiquidacionResumen } from '../../core/models/liquidaciones.models';
import { StylistOption } from '../../core/models/ventas.models';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Vista    = 'lista' | 'nueva' | 'detalle';
type Periodo  = 'hoy' | 'semana' | 'quincena' | 'mes' | 'personalizado';

interface PeriodoOpt { key: Periodo; label: string; }

@Component({
  selector: 'app-liquidaciones',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, IconComponent],
  templateUrl: './liquidaciones.component.html',
  styleUrl: './liquidaciones.component.scss'
})
export class LiquidacionesComponent implements OnInit {
  private readonly fb             = inject(FormBuilder);
  private readonly liqService     = inject(LiquidacionesService);
  private readonly ventasService  = inject(VentasService);
  private readonly branchService  = inject(BranchService);

  readonly vista         = signal<Vista>('lista');
  readonly liquidaciones = signal<LiquidacionResumen[]>([]);
  readonly detalle       = signal<LiquidacionDetalle | null>(null);
  readonly peluqueros    = signal<StylistOption[]>([]);
  readonly guardando     = signal(false);
  readonly msg           = signal<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── Período ───────────────────────────────────────────
  readonly periodo = signal<Periodo>('quincena');

  readonly periodos: PeriodoOpt[] = [
    { key: 'hoy',          label: 'Hoy'           },
    { key: 'semana',       label: 'Esta semana'    },
    { key: 'quincena',     label: 'Esta quincena'  },
    { key: 'mes',          label: 'Este mes'       },
    { key: 'personalizado',label: 'Personalizado'  },
  ];

  readonly rangoAutomatico = computed(() => {
    const hoy = new Date();
    const fmt  = (d: Date) => d.toISOString().split('T')[0];
    switch (this.periodo()) {
      case 'hoy':
        return { start: fmt(hoy), end: fmt(hoy) };
      case 'semana': {
        const lun = new Date(hoy);
        lun.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
        return { start: fmt(lun), end: fmt(hoy) };
      }
      case 'quincena': {
        const d = hoy.getDate();
        const y = hoy.getFullYear();
        const m = hoy.getMonth();
        if (d <= 15) {
          return { start: fmt(new Date(y, m, 1)), end: fmt(new Date(y, m, 15)) };
        } else {
          return { start: fmt(new Date(y, m, 16)), end: fmt(new Date(y, m + 1, 0)) };
        }
      }
      case 'mes': {
        const y = hoy.getFullYear();
        const m = hoy.getMonth();
        return { start: fmt(new Date(y, m, 1)), end: fmt(new Date(y, m + 1, 0)) };
      }
      default:
        return null; // personalizado: el usuario llena los campos
    }
  });

  // ── Formulario ────────────────────────────────────────
  readonly form = this.fb.group({
    stylistId: [null as number | null, Validators.required],
    startDate: ['', Validators.required],
    endDate:   ['', Validators.required],
  });

  // ── Computed lista ────────────────────────────────────
  readonly abiertas = computed(() => this.liquidaciones().filter(l => l.status === 'Open'));
  readonly cerradas = computed(() => this.liquidaciones().filter(l => l.status === 'Closed'));

  constructor() {
    toObservable(this.branchService.selectedBranch)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargar());
  }

  ngOnInit(): void {
    this.ventasService.getPeluqueros(this.branchService.currentBranchId).subscribe({
      next: r => this.peluqueros.set(r.data),
      error: () => {}
    });
  }

  private cargar(): void {
    const branchId = this.branchService.currentBranchId;
    this.liqService.getLiquidaciones(branchId).subscribe({
      next: r => this.liquidaciones.set(r.data),
      error: () => {}
    });
  }

  // ── Navegación ────────────────────────────────────────
  abrirNueva(): void {
    this.periodo.set('quincena');
    this.form.reset();
    this.aplicarPeriodo('quincena');
    this.vista.set('nueva');
  }

  verDetalle(l: LiquidacionResumen): void {
    this.liqService.getDetalle(l.id).subscribe({
      next: r => { this.detalle.set(r.data); this.vista.set('detalle'); },
      error: () => {}
    });
  }

  volver(): void { this.vista.set('lista'); this.detalle.set(null); }

  // ── Selector de período ───────────────────────────────
  seleccionarPeriodo(p: Periodo): void {
    this.periodo.set(p);
    this.aplicarPeriodo(p);
  }

  private aplicarPeriodo(p: Periodo): void {
    const rango = this.rangoAutomatico();
    if (rango) {
      this.form.patchValue({ startDate: rango.start, endDate: rango.end });
    } else {
      this.form.patchValue({ startDate: '', endDate: '' });
    }
  }

  // ── CRUD ──────────────────────────────────────────────
  crear(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    const { stylistId, startDate, endDate } = this.form.value;
    const stylistName = this.peluqueros().find(p => p.id === stylistId)?.fullName ?? '';
    this.liqService.crearLiquidacion({
      stylistId: stylistId!, stylistName,
      startDate: startDate!, endDate: endDate!
    }).subscribe({
      next: () => {
        this.cargar();
        this.mostrarMsg('ok', 'Liquidación creada');
        this.guardando.set(false);
        this.vista.set('lista');
      },
      error: () => { this.mostrarMsg('err', 'Error al crear.'); this.guardando.set(false); }
    });
  }

  cerrar(l: LiquidacionResumen | LiquidacionDetalle): void {
    if (!confirm(`¿Cerrar liquidación de ${l.stylistName}?`)) return;
    this.liqService.cerrarLiquidacion(l.id).subscribe({
      next: () => {
        this.cargar();
        if (this.detalle()?.id === l.id) this.volver();
        this.mostrarMsg('ok', 'Liquidación cerrada');
      },
      error: () => this.mostrarMsg('err', 'Error al cerrar.')
    });
  }

  private mostrarMsg(type: 'ok' | 'err', text: string): void {
    this.msg.set({ type, text });
    setTimeout(() => this.msg.set(null), 4000);
  }
}
