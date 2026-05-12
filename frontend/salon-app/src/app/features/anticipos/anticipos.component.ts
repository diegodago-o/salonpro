import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AnticipasService } from '../../core/services/anticipos.service';
import { VentasService } from '../../core/services/ventas.service';
import { Anticipo, CreateAnticipoRequest } from '../../core/models/anticipos.models';
import { PaymentMethodOption } from '../../core/models/ventas.models';

type Vista = 'lista' | 'nuevo';
type FiltroStatus = 'todos' | 'Active' | 'Applied' | 'Voided';

@Component({
  selector: 'app-anticipos',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './anticipos.component.html',
  styleUrl: './anticipos.component.scss'
})
export class AnticiposComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly anticiposService = inject(AnticipasService);
  private readonly ventasService = inject(VentasService);

  readonly vista = signal<Vista>('lista');
  readonly anticipos = signal<Anticipo[]>([]);
  readonly metodosPago = signal<PaymentMethodOption[]>([]);
  readonly filtroStatus = signal<FiltroStatus>('todos');
  readonly guardando = signal(false);
  readonly msg = signal<{ type: 'ok' | 'err'; text: string } | null>(null);

  readonly anticiposFiltrados = computed(() => {
    const f = this.filtroStatus();
    if (f === 'todos') return this.anticipos();
    return this.anticipos().filter(a => a.status === f);
  });

  readonly totalActivos = computed(() =>
    this.anticipos().filter(a => a.status === 'Active').reduce((s, a) => s + a.amount, 0)
  );

  readonly form = this.fb.group({
    clientDocumentType:   ['CC', Validators.required],
    clientDocumentNumber: ['', Validators.required],
    clientFullName:       ['', Validators.required],
    clientPhone:          ['', Validators.required],
    amount:               [0, [Validators.required, Validators.min(1000)]],
    paymentMethodId:      [null as number | null, Validators.required],
    notes:                [''],
  });

  readonly formValido = signal(false);

  ngOnInit(): void {
    this.cargar();
    this.ventasService.getMetodosPago().subscribe(r => this.metodosPago.set(r.data));
    this.form.statusChanges.subscribe(s => this.formValido.set(s === 'VALID'));
  }

  private cargar(): void {
    this.anticiposService.getAnticipos().subscribe(r => this.anticipos.set(r.data));
  }

  abrirNuevo(): void {
    this.form.reset({ clientDocumentType: 'CC', amount: 0 });
    this.formValido.set(false);
    this.vista.set('nuevo');
  }

  volver(): void { this.vista.set('lista'); }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    const req = this.form.value as CreateAnticipoRequest;
    this.anticiposService.crearAnticipo(req).subscribe({
      next: () => {
        this.cargar();
        this.mostrarMsg('ok', 'Anticipo registrado');
        this.guardando.set(false);
        this.vista.set('lista');
      },
      error: () => { this.mostrarMsg('err', 'Error al registrar.'); this.guardando.set(false); }
    });
  }

  anular(a: Anticipo): void {
    if (!confirm(`¿Anular anticipo de ${a.clientName}?`)) return;
    this.anticiposService.anularAnticipo(a.id).subscribe(() => {
      this.cargar();
      this.mostrarMsg('ok', 'Anticipo anulado');
    });
  }

  labelStatus(s: string): string {
    return s === 'Active' ? 'Activo' : s === 'Applied' ? 'Aplicado' : 'Anulado';
  }

  private mostrarMsg(type: 'ok' | 'err', text: string): void {
    this.msg.set({ type, text });
    setTimeout(() => this.msg.set(null), 4000);
  }
}
