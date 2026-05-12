import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { CatalogoService } from '../../core/services/catalogo.service';
import { ProductOption } from '../../core/models/ventas.models';
import { IconComponent } from '../../shared/components/icon/icon.component';

/** Threshold below which a product is considered low stock. */
const LOW_STOCK_THRESHOLD = 3;

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, IconComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss'
})
export class InventarioComponent implements OnInit {
  private readonly catalogoService = inject(CatalogoService);

  readonly Math = Math;
  readonly lowStockThreshold = LOW_STOCK_THRESHOLD;

  readonly productos = signal<ProductOption[]>([]);
  readonly tab = signal<'all' | 'sale' | 'internal'>('all');

  readonly lista = computed(() => {
    const t = this.tab();
    const all = this.productos();
    if (t === 'sale') return all.filter(p => p.isForSale);
    if (t === 'internal') return all.filter(p => !p.isForSale);
    return all;
  });

  readonly conStockBajo = computed(() =>
    this.productos().filter(p => p.stock <= LOW_STOCK_THRESHOLD).length
  );

  margen(p: ProductOption): number {
    if (!p.salePrice || p.salePrice === 0) return 0;
    return (p.salePrice - p.purchasePrice) / p.salePrice * 100;
  }

  ngOnInit(): void {
    this.catalogoService.getProductos().subscribe(r => this.productos.set(r.data));
  }
}
