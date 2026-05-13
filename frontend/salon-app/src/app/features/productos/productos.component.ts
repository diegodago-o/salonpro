import { Component, effect, inject, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CatalogoService } from '../../core/services/catalogo.service';
import { BranchService } from '../../core/services/branch.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Producto } from '../../core/models/catalogo.models';

type Tab = 'all' | 'sale' | 'internal';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, IconComponent],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss'
})
export class ProductosComponent implements OnInit {
  private readonly catalogoService = inject(CatalogoService);
  private readonly branchService = inject(BranchService);
  private readonly fb = inject(FormBuilder);

  readonly productos = signal<Producto[]>([]);
  readonly tab = signal<Tab>('all');
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly errorMsg = signal<string | null>(null);

  // Modal
  readonly modalAbierto = signal(false);
  readonly editandoId = signal<number | null>(null);

  readonly lista = computed(() => {
    const t = this.tab();
    return this.productos().filter(p =>
      t === 'all' ? true : t === 'sale' ? p.isForSale : !p.isForSale
    );
  });

  readonly conStockBajo = computed(() => this.productos().filter(p => p.stock <= 5).length);

  readonly form = this.fb.group({
    name:                    ['', Validators.required],
    brand:                   ['', Validators.required],
    category:                ['', Validators.required],
    purchasePrice:           [0, [Validators.required, Validators.min(0)]],
    salePrice:               [0, [Validators.min(0)]],
    stylistCommissionPercent:[10, [Validators.required, Validators.min(0), Validators.max(100)]],
    stock:                   [0, [Validators.required, Validators.min(0)]],
    isForSale:               [false],
  });

  margen(p: Producto): number {
    return p.salePrice > 0 ? Math.round((p.salePrice - p.purchasePrice) / p.salePrice * 100) : 0;
  }

  constructor() {
    effect(() => {
      this.branchService.selectedBranch(); // track branch changes
      this.cargar();
    });
  }

  ngOnInit(): void { /* cargar se dispara desde el effect() */ }

  private cargar(): void {
    this.cargando.set(true);
    const branchId = this.branchService.currentBranchId;
    this.catalogoService.getProductos(branchId).subscribe(r => {
      if (r.success && r.data) this.productos.set(r.data);
      this.cargando.set(false);
    });
  }

  setTab(t: Tab): void { this.tab.set(t); }

  abrirNuevo(): void {
    this.editandoId.set(null);
    this.form.reset({
      name: '', brand: '', category: '',
      purchasePrice: 0, salePrice: 0,
      stylistCommissionPercent: 10,
      stock: 0, isForSale: false
    });
    this.errorMsg.set(null);
    this.modalAbierto.set(true);
  }

  abrirEditar(p: Producto): void {
    this.editandoId.set(p.id);
    this.form.patchValue({
      name: p.name,
      brand: p.brand,
      category: p.category,
      purchasePrice: p.purchasePrice,
      salePrice: p.salePrice,
      stylistCommissionPercent: p.stylistCommissionPercent,
      stock: p.stock,
      isForSale: p.isForSale,
    });
    this.errorMsg.set(null);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void { this.modalAbierto.set(false); }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.errorMsg.set(null);
    const v = this.form.value;
    const req = {
      name:                    v.name!,
      brand:                   v.brand!,
      category:                v.category!,
      purchasePrice:           v.purchasePrice!,
      salePrice:               v.salePrice ?? 0,
      stylistCommissionPercent:v.stylistCommissionPercent!,
      stock:                   v.stock!,
      isForSale:               v.isForSale ?? false,
    };

    const id = this.editandoId();
    const branchId = this.branchService.currentBranchId;
    const op$ = id
      ? this.catalogoService.actualizarProducto(id, req)
      : this.catalogoService.crearProducto(req, branchId);

    op$.subscribe({
      next: r => {
        if (r.success && r.data) {
          if (id) {
            this.productos.update(l => l.map(p => p.id === id ? r.data! : p));
          } else {
            this.productos.update(l => [...l, r.data!]);
          }
        }
        this.guardando.set(false);
        this.modalAbierto.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al guardar. Intenta de nuevo.');
        this.guardando.set(false);
      }
    });
  }
}
