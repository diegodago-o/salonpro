import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import { CreateServicioRequest, Servicio } from '../../core/models/catalogo.models';

type Vista = 'lista' | 'form';

@Component({
  selector: 'app-servicios',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.scss'
})
export class ServiciosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catService = inject(CatalogoService);
  private readonly auth = inject(AuthService);

  readonly esPropietario = computed(() => this.auth.currentUser()?.role === 'TenantOwner');
  readonly vista = signal<Vista>('lista');
  readonly servicios = signal<Servicio[]>([]);
  readonly editando = signal<Servicio | null>(null);
  readonly filtro = signal('');
  readonly soloActivos = signal(true);
  readonly guardando = signal(false);
  readonly msg = signal<{ type: 'ok' | 'err'; text: string } | null>(null);

  readonly serviciosFiltrados = computed(() => {
    const f = this.filtro().toLowerCase();
    return this.servicios().filter(s =>
      (!this.soloActivos() || s.isActive) &&
      (!f || s.name.toLowerCase().includes(f) || s.category.toLowerCase().includes(f))
    );
  });

  readonly categorias = computed(() => [...new Set(this.servicios().map(s => s.category))]);

  readonly form = this.fb.group({
    name:            ['', Validators.required],
    category:        ['', Validators.required],
    price:           [0, [Validators.required, Validators.min(1)]],
    hasSalonFee:     [false],
    salonFeePercent: [0, [Validators.min(0), Validators.max(100)]],
  });

  ngOnInit(): void { this.cargar(); }

  private cargar(): void {
    this.catService.getServicios().subscribe(r => this.servicios.set(r.data));
  }

  abrirNuevo(): void {
    this.form.reset({ hasSalonFee: false, salonFeePercent: 0, price: 0 });
    this.editando.set(null);
    this.vista.set('form');
  }

  abrirEditar(s: Servicio): void {
    this.editando.set(s);
    this.form.patchValue(s);
    this.vista.set('form');
  }

  volver(): void { this.vista.set('lista'); }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    const req = this.form.value as CreateServicioRequest;
    const ed = this.editando();

    const obs = ed
      ? this.catService.actualizarServicio(ed.id, req)
      : this.catService.crearServicio(req);

    obs.subscribe({
      next: () => {
        this.cargar();
        this.mostrarMsg('ok', ed ? 'Servicio actualizado' : 'Servicio creado');
        this.guardando.set(false);
        this.vista.set('lista');
      },
      error: () => { this.mostrarMsg('err', 'Error al guardar.'); this.guardando.set(false); }
    });
  }

  toggleActivo(s: Servicio): void {
    this.catService.toggleServicio(s.id, !s.isActive).subscribe(() => this.cargar());
  }

  private mostrarMsg(type: 'ok' | 'err', text: string): void {
    this.msg.set({ type, text });
    setTimeout(() => this.msg.set(null), 4000);
  }
}
