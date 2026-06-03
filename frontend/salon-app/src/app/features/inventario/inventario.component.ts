import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogoService } from '../../core/services/catalogo.service';
import { BranchService } from '../../core/services/branch.service';
import { Producto } from '../../core/models/catalogo.models';
import { IconComponent } from '../../shared/components/icon/icon.component';

const LOW = 5;

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, ReactiveFormsModule, IconComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss'
})
export class InventarioComponent {
  private readonly catalogoService = inject(CatalogoService);
  private readonly branchService = inject(BranchService);
  private readonly fb = inject(FormBuilder);

  readonly Math = Math;
  readonly LOW = LOW;

  readonly productos  = signal<Producto[]>([]);
  readonly cargando   = signal(true);
  readonly guardando  = signal(false);
  readonly errorMsg   = signal<string | null>(null);
  readonly tab        = signal<'all' | 'sale' | 'internal'>('all');

  // ── Filtros ──────────────────────────────────────────
  readonly busqueda        = signal('');
  readonly filtroMarca     = signal('');
  readonly filtroCategoria = signal('');

  readonly marcas = computed(() =>
    [...new Set(this.productos().map(p => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
  );

  readonly hayFiltros = computed(() =>
    this.busqueda() !== '' || this.filtroMarca() !== '' || this.filtroCategoria() !== ''
  );

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroMarca.set('');
    this.filtroCategoria.set('');
  }

  // Modales
  readonly modalProducto  = signal(false);
  readonly modalEntrada   = signal(false);
  readonly editandoId     = signal<number | null>(null);
  readonly entradaProducto = signal<Producto | null>(null);

  readonly modoEdicion = computed(() => this.editandoId() !== null);

  // Form producto
  readonly formProducto = this.fb.group({
    name:                    ['', Validators.required],
    brand:                   [''],
    category:                ['', Validators.required],
    purchasePrice:           [0, [Validators.required, Validators.min(0)]],
    salePrice:               [0, [Validators.min(0)]],
    stylistCommissionPercent:[10, [Validators.required, Validators.min(0), Validators.max(100)]],
    stock:                   [0, [Validators.required, Validators.min(0)]],
    isForSale:               [false],
    barcode:                 [null as string | null],
  });

  // Form entrada de stock
  readonly formEntrada = this.fb.group({
    cantidad: [0, [Validators.required, Validators.min(1)]],
  });

  readonly categorias = computed(() =>
    [...new Set(this.productos().map(p => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
  );

  // ── Selector de categoría ────────────────────────────
  readonly NUEVA_CAT = '__nueva__';
  readonly catSeleccionada = signal<string>('');

  onCatSelectChange(value: string): void {
    this.catSeleccionada.set(value);
    if (value !== this.NUEVA_CAT) {
      this.formProducto.get('category')!.setValue(value);
    } else {
      this.formProducto.get('category')!.setValue('');
    }
  }

  readonly lista = computed(() => {
    const t  = this.tab();
    const q  = this.busqueda().trim().toLowerCase();
    const mb = this.filtroMarca();
    const mc = this.filtroCategoria();

    let all = this.productos();
    if (t === 'sale')     all = all.filter(p => p.isForSale);
    if (t === 'internal') all = all.filter(p => !p.isForSale);
    if (mb) all = all.filter(p => p.brand === mb);
    if (mc) all = all.filter(p => (p.category?.trim() || 'Sin categoría') === mc);
    if (q)  all = all.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brand?.toLowerCase() ?? '').includes(q) ||
      (p.barcode ?? '').toLowerCase().includes(q)
    );
    return all;
  });

  // ── Acordeón por categoría ────────────────────────────
  readonly porCategoria = computed(() => {
    const groups = new Map<string, Producto[]>();
    for (const p of this.lista()) {
      const cat = p.category?.trim() || 'Sin categoría';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(p);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([cat, productos]) => ({
        cat,
        productos,
        conBajo: productos.filter(p => p.stock <= LOW).length
      }));
  });

  // Categorías colapsadas (vacío = todas abiertas)
  readonly categoriasColapsadas = signal<Set<string>>(new Set<string>());

  toggleCategoria(cat: string): void {
    const s = new Set(this.categoriasColapsadas());
    if (s.has(cat)) s.delete(cat); else s.add(cat);
    this.categoriasColapsadas.set(s);
  }

  isCategoriaAbierta(cat: string): boolean {
    return !this.categoriasColapsadas().has(cat);
  }

  readonly conStockBajo = computed(() =>
    this.productos().filter(p => p.stock <= LOW).length
  );

  margen(p: Producto): number {
    if (!p.salePrice || p.salePrice === 0) return 0;
    return (p.salePrice - p.purchasePrice) / p.salePrice * 100;
  }

  constructor() {
    toObservable(this.branchService.selectedBranch)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargar());
  }

  private cargar(): void {
    this.cargando.set(true);
    const branchId = this.branchService.currentBranchId;
    this.catalogoService.getProductos(branchId).subscribe({
      next: r => { if (r.success && r.data) this.productos.set(r.data); },
      error: () => {},
      complete: () => this.cargando.set(false)
    });
  }

  // ── Modal Producto ──────────────────────────────────────
  abrirNuevo(): void {
    this.editandoId.set(null);
    this.formProducto.reset({ name: '', brand: '', category: '', purchasePrice: 0, salePrice: 0, stylistCommissionPercent: 10, stock: 0, isForSale: false, barcode: null });
    this.catSeleccionada.set('');
    this.errorMsg.set(null);
    this.modalProducto.set(true);
  }

  abrirEditar(p: Producto): void {
    this.editandoId.set(p.id);
    this.formProducto.patchValue({
      name: p.name, brand: p.brand, category: p.category,
      purchasePrice: p.purchasePrice, salePrice: p.salePrice,
      stylistCommissionPercent: p.stylistCommissionPercent,
      stock: p.stock, isForSale: p.isForSale, barcode: p.barcode ?? null
    });
    const existe = this.categorias().includes(p.category);
    this.catSeleccionada.set(existe ? p.category : this.NUEVA_CAT);
    this.errorMsg.set(null);
    this.modalProducto.set(true);
  }

  cerrarModalProducto(): void { this.modalProducto.set(false); this.editandoId.set(null); }

  guardarProducto(): void {
    if (this.formProducto.invalid || this.guardando()) return;

    // ── Validar código de barras único ────────────────
    const barcode = (this.formProducto.get('barcode')?.value ?? '').trim();
    if (barcode) {
      const editId = this.editandoId();
      const duplicado = this.productos().some(p =>
        (p.barcode ?? '').trim() === barcode && p.id !== editId
      );
      if (duplicado) {
        this.errorMsg.set('El código de barras ya está registrado en otro producto. Debe ser único.');
        return;
      }
    }

    this.guardando.set(true);
    this.errorMsg.set(null);
    const v = this.formProducto.value;
    const req = {
      name: v.name!, brand: v.brand || '', category: v.category!,
      purchasePrice: v.purchasePrice!, salePrice: v.isForSale ? (v.salePrice ?? 0) : 0,
      stylistCommissionPercent: v.stylistCommissionPercent ?? 10,
      stock: v.stock!, isForSale: v.isForSale ?? false,
      barcode: v.barcode || null
    };
    const branchId = this.branchService.currentBranchId;
    const op$ = this.modoEdicion()
      ? this.catalogoService.actualizarProducto(this.editandoId()!, req, branchId)
      : this.catalogoService.crearProducto(req, branchId);
    op$.subscribe({
      next: () => { this.cargar(); this.cerrarModalProducto(); this.guardando.set(false); },
      error: () => { this.errorMsg.set('Error al guardar. Intenta de nuevo.'); this.guardando.set(false); }
    });
  }

  // ── Modal Entrada de stock ──────────────────────────────
  abrirEntrada(p?: Producto): void {
    this.entradaProducto.set(p ?? null);
    this.formEntrada.reset({ cantidad: 0 });
    this.errorMsg.set(null);
    this.modalEntrada.set(true);
  }

  cerrarModalEntrada(): void { this.modalEntrada.set(false); this.entradaProducto.set(null); }

  guardarEntrada(): void {
    if (this.formEntrada.invalid || this.guardando()) return;
    const p = this.entradaProducto();
    if (!p) return;
    this.guardando.set(true);
    const nuevoStock = p.stock + (this.formEntrada.value.cantidad ?? 0);
    const branchId = this.branchService.currentBranchId;
    this.catalogoService.ajustarStock(p.id, nuevoStock, branchId).subscribe({
      next: () => { this.cargar(); this.cerrarModalEntrada(); this.guardando.set(false); },
      error: () => { this.errorMsg.set('Error al actualizar stock.'); this.guardando.set(false); }
    });
  }
}
