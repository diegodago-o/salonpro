import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CatalogoService } from '../../core/services/catalogo.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CurrencyPipe, IconComponent],
  templateUrl: './servicios.component.html',
  styleUrl: './servicios.component.scss'
})
export class ServiciosComponent implements OnInit {
  private readonly catalogoService = inject(CatalogoService);

  readonly servicios = signal<any[]>([]);
  readonly cargando = signal(true);

  readonly categorias = computed(() => [...new Set(this.servicios().map((s: any) => s.category))]);

  serviciosPorCategoria(cat: string): any[] {
    return this.servicios().filter((s: any) => s.category === cat);
  }

  ngOnInit(): void {
    this.catalogoService.getServicios().subscribe(r => {
      if (r.success && r.data) this.servicios.set(r.data);
      this.cargando.set(false);
    });
  }
}
