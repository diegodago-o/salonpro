import { Component, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogoService } from '../../core/services/catalogo.service';
import { BranchService } from '../../core/services/branch.service';
import { Servicio } from '../../core/models/catalogo.models';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, IconComponent],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.scss'
})
export class ServiciosComponent {
  private readonly catalogoService = inject(CatalogoService);
  private readonly branchService = inject(BranchService);
  private readonly fb = inject(FormBuilder);

  readonly servicios  = signal<Servicio[]>([]);
  readonly cargando   = signal(true);
  readonly guardando  = signal(false);
  readonly errorMsg   = signal<string | null>(null);

  // Modal
  readonly modalAbierto   = signal(false);
  readonly editandoId     = signal<number | null>(null);
  readonly modoEdicion    = computed(() => this.editandoId() !== null);

  readonly form = this.fb.group({
    name:           ['', Validators.required],
    category:       ['', Validators.required],
    price:          [0,  [Validators.required, Validators.min(1)]],
    hasSalonFee:    [false],
    salonFeePercent:[0,  [Validators.min(0), Validators.max(100)]],
  });

  readonly categorias = computed(() =>
    [...new Set(this.servicios().map(s => s.category))]
  );

  // ── Combo-box de categoría ────────────────────────────
  readonly showCatDropdown = signal(false);

  readonly categoriasFiltradas = computed(() => {
    const typed = (this.form.get('category')?.value ?? '').toLowerCase().trim();
    const all   = this.categorias();
    return typed ? all.filter(c => c.toLowerCase().includes(typed)) : all;
  });

  selectCategory(cat: string) {
    this.form.get('category')!.setValue(cat);
    this.showCatDropdown.set(false);
  }

  onCatBlur() {
    // Pequeño delay para que el click en la opción se registre antes del blur
    setTimeout(() => this.showCatDropdown.set(false), 160);
  }

  serviciosPorCategoria(cat: string): Servicio[] {
    return this.servicios().filter(s => s.category === cat);
  }

  constructor() {
    toObservable(this.branchService.selectedBranch)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargar());
  }

  private cargar(): void {
    this.cargando.set(true);
    const branchId = this.branchService.currentBranchId;
    this.catalogoService.getServicios(branchId).subscribe({
      next: r => { if (r.success && r.data) this.servicios.set(r.data); },
      error: () => {},
      complete: () => this.cargando.set(false)
    });
  }

  abrirNuevo(): void {
    this.editandoId.set(null);
    this.form.reset({ name: '', category: '', price: 0, hasSalonFee: false, salonFeePercent: 0 });
    this.errorMsg.set(null);
    this.modalAbierto.set(true);
  }

  abrirEditar(s: Servicio): void {
    this.editandoId.set(s.id);
    this.form.patchValue({
      name: s.name, category: s.category, price: s.price,
      hasSalonFee: s.hasSalonFee, salonFeePercent: s.salonFeePercent
    });
    this.errorMsg.set(null);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.editandoId.set(null);
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.errorMsg.set(null);

    const v = this.form.value;
    const req = {
      name:           v.name!,
      category:       v.category!,
      price:          v.price!,
      hasSalonFee:    v.hasSalonFee ?? false,
      salonFeePercent: v.hasSalonFee ? (v.salonFeePercent ?? 0) : 0,
    };

    const branchId = this.branchService.currentBranchId;
    const op$ = this.modoEdicion()
      ? this.catalogoService.actualizarServicio(this.editandoId()!, req)
      : this.catalogoService.crearServicio(req, branchId);

    op$.subscribe({
      next: () => { this.cargar(); this.cerrarModal(); this.guardando.set(false); },
      error: () => { this.errorMsg.set('Error al guardar. Intenta de nuevo.'); this.guardando.set(false); }
    });
  }

  toggle(s: Servicio): void {
    this.catalogoService.toggleServicio(s.id, !s.isActive).subscribe({
      next: () => this.cargar(),
      error: () => {}
    });
  }
}
