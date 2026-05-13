import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
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
export class InventarioComponent implements OnInit {
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
  });

  // Form entrada de stock
  readonly formEntrada = this.fb.group({
    cantidad: [0, [Validators.required, Validators.min(1)]],
  });

  readonly lista = computed(() => {
    const t = this.tab();
    const all = this.productos();
    if (t === 'sale')     return all.filter(p => p.isForSale);
    if (t === 'internal') return all.filter(p => !p.isForSale);
    return all;
  });

  readonly conStockBajo = computed(() =>
    this.productos().filter(p => p.stock <= LOW).length
  );

  margen(p: Producto): number {
    if (!p.salePrice || p.salePrice === 0) return 0;
    return (p.salePrice - p.purchasePrice) / p.salePrice * 100;
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
    this.catalogoService.getProductos(branchId).subscribe({
      next: r => { if (r.success && r.data) this.productos.set(r.data); },
      error: () => {},
      complete: () => this.cargando.set(false)
    });
  }

  // ── Modal Producto ──────────────────────────────────────
  abrirNuevo(): void {
    this.editandoId.set(null);
    this.formProducto.reset({ name: '', brand: '', category: '', purchasePrice: 0, salePrice: 0, stylistCommissionPercent: 10, stock: 0, isForSale: false });
    this.errorMsg.set(null);
    this.modalProducto.set(true);
  }

  abrirEditar(p: Producto): void {
    this.editandoId.set(p.id);
    this.formProducto.patchValue({
      name: p.name, brand: p.brand, category: p.category,
      purchasePrice: p.purchasePrice, salePrice: p.salePrice,
      stylistCommissionPercent: p.stylistCommissionPercent,
      stock: p.stock, isForSale: p.isForSale
    });
    this.errorMsg.set(null);
    this.modalProducto.set(true);
  }

  cerrarModalProducto(): void { this.modalProducto.set(false); this.editandoId.set(null); }

  guardarProducto(): void {
    if (this.formProducto.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.errorMsg.set(null);
    const v = this.formProducto.value;
    const req = {
      name: v.name!, brand: v.brand || '', category: v.category!,
      purchasePrice: v.purchasePrice!, salePrice: v.isForSale ? (v.salePrice ?? 0) : 0,
      stylistCommissionPercent: v.stylistCommissionPercent ?? 10,
      stock: v.stock!, isForSale: v.isForSale ?? false
    };
    const branchId = this.branchService.currentBranchId;
    const op$ = this.modoEdicion()
      ? this.catalogoService.actualizarProducto(this.editandoId()!, req)
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
    this.catalogoService.ajustarStock(p.id, nuevoStock).subscribe({
      next: () => { this.cargar(); this.cerrarModalEntrada(); this.guardando.set(false); },
      error: () => { this.errorMsg.set('Error al actualizar stock.'); this.guardando.set(false); }
    });
  }
}
