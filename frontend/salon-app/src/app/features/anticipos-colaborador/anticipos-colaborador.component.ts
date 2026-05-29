import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AnticiposColaboradorService } from '../../core/services/anticipos-colaborador.service';
import { VentasService } from '../../core/services/ventas.service';
import { BranchService } from '../../core/services/branch.service';
import { AnticipoColaborador, AnticipoColaboradorStatus } from '../../core/models/anticipos-colaborador.models';
import { StylistOption } from '../../core/models/ventas.models';
import { todayColombia } from '../../core/utils/colombia-time';

type Vista       = 'lista' | 'nuevo';
type FiltroStatus = 'todos' | AnticipoColaboradorStatus;

@Component({
  selector: 'app-anticipos-colaborador',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './anticipos-colaborador.component.html',
  styleUrl: './anticipos-colaborador.component.scss'
})
export class AnticiposColaboradorComponent implements OnInit {
  private readonly fb        = inject(FormBuilder);
  private readonly service   = inject(AnticiposColaboradorService);
  private readonly ventasSvc = inject(VentasService);
  private readonly branchSvc = inject(BranchService);

  readonly vista          = signal<Vista>('lista');
  readonly anticipos      = signal<AnticipoColaborador[]>([]);
  readonly peluqueros     = signal<StylistOption[]>([]);
  readonly filtroStatus   = signal<FiltroStatus>('todos');
  readonly filtroStylist  = signal<number | null>(null);
  readonly guardando      = signal(false);
  readonly cargando       = signal(false);
  readonly msg            = signal<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── Computed ─────────────────────────────────────────────────────────
  readonly anticiposFiltrados = computed(() => {
    let list = this.anticipos();
    const fs = this.filtroStatus();
    const fp = this.filtroStylist();
    if (fs !== 'todos') list = list.filter(a => a.status === fs);
    if (fp)             list = list.filter(a => a.stylistId === fp);
    return list;
  });

  readonly totalPendiente = computed(() =>
    this.anticipos()
      .filter(a => a.status === 'Pendiente')
      .reduce((s, a) => s + a.amount, 0)
  );

  readonly totalAplicado = computed(() =>
    this.anticipos()
      .filter(a => a.status === 'Aplicado')
      .reduce((s, a) => s + a.amount, 0)
  );

  // ── Formulario ───────────────────────────────────────────────────────
  readonly form = this.fb.group({
    stylistId:   [null as number | null, Validators.required],
    amount:      [0, [Validators.required, Validators.min(1000)]],
    date:        [todayColombia(), Validators.required],
    notes:       [''],
  });

  readonly formValido = signal(false);

  constructor() {
    toObservable(this.branchSvc.selectedBranch)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargar());
  }

  ngOnInit(): void {
    this.ventasSvc.getPeluqueros(this.branchSvc.currentBranchId).subscribe(r => this.peluqueros.set(r.data));
    this.form.statusChanges.subscribe(s => this.formValido.set(s === 'VALID'));
  }

  private cargar(): void {
    this.cargando.set(true);
    const branchId = this.branchSvc.currentBranchId;
    this.service.getAnticipos(undefined, undefined, branchId).subscribe({
      next:  r  => { this.anticipos.set(r.data); this.cargando.set(false); },
      error: () => {
        this.cargando.set(false);
        this.mostrarMsg('err', 'No se pudieron cargar los anticipos. Verifica que el servidor esté activo.');
      }
    });
  }

  abrirNuevo(): void {
    this.form.reset({ stylistId: null, amount: 0, date: todayColombia(), notes: '' });
    this.formValido.set(false);
    this.vista.set('nuevo');
  }

  volver(): void { this.vista.set('lista'); }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);

    const v        = this.form.value;
    const stylist  = this.peluqueros().find(p => p.id === Number(v.stylistId));

    const req = {
      stylistId:   Number(v.stylistId!),
      stylistName: stylist?.fullName ?? '',
      amount:      Number(v.amount!),
      date:        v.date!,
      notes:       v.notes || undefined
    };

    this.service.crearAnticipo(req).subscribe({
      next: () => {
        this.cargar();
        this.mostrarMsg('ok', 'Anticipo registrado correctamente.');
        this.guardando.set(false);
        this.vista.set('lista');
      },
      error: () => {
        this.mostrarMsg('err', 'Error al registrar el anticipo.');
        this.guardando.set(false);
      }
    });
  }

  anular(a: AnticipoColaborador): void {
    if (!confirm(`¿Anular anticipo de $${a.amount.toLocaleString('es-CO')} a ${a.stylistName}?`)) return;
    this.service.anularAnticipo(a.id).subscribe({
      next: () => { this.cargar(); this.mostrarMsg('ok', 'Anticipo anulado.'); },
      error: () => this.mostrarMsg('err', 'No se pudo anular el anticipo.')
    });
  }

  labelStatus(s: AnticipoColaboradorStatus | string): string {
    const map: Record<string, string> = {
      Pendiente: 'Pendiente',
      Aplicado:  'Aplicado',
      Anulado:   'Anulado'
    };
    return map[s] ?? s;
  }

  private mostrarMsg(type: 'ok' | 'err', text: string): void {
    this.msg.set({ type, text });
    setTimeout(() => this.msg.set(null), 4000);
  }
}
