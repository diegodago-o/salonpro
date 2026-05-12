import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CatalogoService } from '../../core/services/catalogo.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Tab = 'all' | 'sale' | 'internal';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CurrencyPipe, IconComponent],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss'
})
export class ProductosComponent implements OnInit {
  private readonly catalogoService = inject(CatalogoService);

  readonly productos = signal<any[]>([]);
  readonly tab = signal<Tab>('all');
  readonly cargando = signal(true);

  readonly lista = computed(() => {
    const t = this.tab();
    return this.productos().filter(p =>
      t === 'all' ? true : t === 'sale' ? p.isForSale : !p.isForSale
    );
  });

  readonly conStockBajo = computed(() => this.productos().filter(p => p.stock <= 5).length);

  margen(p: any): number {
    return p.salePrice > 0 ? Math.round((p.salePrice - p.purchasePrice) / p.salePrice * 100) : 0;
  }

  ngOnInit(): void {
    this.catalogoService.getProductos().subscribe(r => {
      if (r.success && r.data) this.productos.set(r.data);
      this.cargando.set(false);
    });
  }

  setTab(t: Tab): void { this.tab.set(t); }
}
