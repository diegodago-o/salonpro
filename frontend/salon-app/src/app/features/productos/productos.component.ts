import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import { CreateProductoRequest, Producto } from '../../core/models/catalogo.models';

type Vista = 'lista' | 'form' | 'stock';

@Component({
  selector: 'app-productos',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss'
})
export class ProductosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catService = inject(CatalogoService);
  private readonly auth = inject(AuthService);

  readonly esPropietario = computed(() => this.auth.currentUser()?.role === 'TenantOwner');
  readonly vista = signal<Vista>('lista');
  readonly productos = signal<Producto[]>([]);
  readonly editando = signal<Producto | null>(null);
  readonly filtro = signal('');
  readonly soloActivos = signal(true);
  readonly guardando = signal(false);
  readonly msg = signal<{ type: 'ok' | 'err'; text: string } | null>(null);
  readonly nuevoStock = signal(0);

  readonly productosFiltrados = computed(() => {
    const f = this.filtro().toLowerCase();
    return this.productos().filter(p =>
      (!this.soloActivos() || p.isActive) &&
      (!f || p.name.toLowerCase().includes(f) || p.brand.toLowerCase().includes(f) || p.category.toLowerCase().includes(f))
    );
  });

  readonly form = this.fb.group({
    name:          ['', Validators.required],
    brand:         ['', Validators.required],
    category:      ['', Validators.required],
    purchasePrice: [0, [Validators.required, Validators.min(0)]],
    salePrice:     [0, [Validators.min(0)]],
    stock:         [0, [Validators.required, Validators.min(0)]],
    isForSale:     [false],
  });

  ngOnInit(): void { this.cargar(); }

  private cargar(): void {
    this.catService.getProductos().subscribe(r => this.productos.set(r.data));
  }

  abrirNuevo(): void {
    this.form.reset({ isForSale: false, purchasePrice: 0, salePrice: 0, stock: 0 });
    this.editando.set(null);
    this.vista.set('form');
  }

  abrirEditar(p: Producto): void {
    this.editando.set(p);
    this.form.patchValue(p);
    this.vista.set('form');
  }

  abrirStock(p: Producto): void {
    this.editando.set(p);
    this.nuevoStock.set(p.stock);
    this.vista.set('stock');
  }

  volver(): void { this.vista.set('lista'); }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    const req = this.form.value as CreateProductoRequest;
    const ed = this.editando();

    const obs = ed
      ? this.catService.actualizarProducto(ed.id, req)
      : this.catService.crearProducto(req);

    obs.subscribe({
      next: () => {
        this.cargar();
        this.mostrarMsg('ok', ed ? 'Producto actualizado' : 'Producto creado');
        this.guardando.set(false);
        this.vista.set('lista');
      },
      error: () => { this.mostrarMsg('err', 'Error al guardar.'); this.guardando.set(false); }
    });
  }

  guardarStock(): void {
    const p = this.editando();
    if (!p) return;
    this.catService.ajustarStock(p.id, this.nuevoStock()).subscribe(() => {
      this.cargar();
      this.mostrarMsg('ok', 'Stock actualizado');
      this.vista.set('lista');
    });
  }

  toggleActivo(p: Producto): void {
    this.catService.toggleProducto(p.id, !p.isActive).subscribe(() => this.cargar());
  }

  private mostrarMsg(type: 'ok' | 'err', text: string): void {
    this.msg.set({ type, text });
    setTimeout(() => this.msg.set(null), 4000);
  }
}
