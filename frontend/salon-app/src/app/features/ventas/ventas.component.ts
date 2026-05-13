import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { VentasService } from '../../core/services/ventas.service';
import { CajaService } from '../../core/services/caja.service';
import { BranchService } from '../../core/services/branch.service';
import {
  ClientOption, PaymentEntry, PaymentMethodOption, ProductOption,
  SaleCalculation, SaleItem, SaleProductItem, SaleServiceItem,
  ServiceOption, StylistOption, Sale
} from '../../core/models/ventas.models';
import { calculateSale } from '../../core/utils/sale-calculator';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Vista = 'lista' | 'nueva-venta' | 'anular';

@Component({
  selector: 'app-ventas',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, DecimalPipe, IconComponent],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss'
})
export class VentasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ventasService = inject(VentasService);
  private readonly cajaService = inject(CajaService);
  private readonly branchService = inject(BranchService);

  readonly vista = signal<Vista>('lista');
  readonly guardando = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);

  // ── Catálogos ─────────────────────────────────────────
  readonly servicios = signal<ServiceOption[]>([]);
  readonly productos = signal<ProductOption[]>([]);
  readonly peluqueros = signal<StylistOption[]>([]);
  readonly metodosPago = signal<PaymentMethodOption[]>([]);

  readonly ventas = signal<Sale[]>([]);
  readonly ventaAnular = signal<Sale | null>(null);

  readonly clienteEncontrado = signal<ClientOption | null>(null);
  readonly buscandoCliente = signal(false);
  readonly items = signal<SaleItem[]>([]);
  readonly peluqueroSeleccionado = signal<StylistOption | null>(null);
  readonly cajaAbierta = signal(false);
  readonly cargandoCatalogos = signal(true);
  readonly Math = Math;

  readonly wizardSteps = [
    { n: '01', t: 'Peluquero',  sub: '¿Quién prestará el servicio?' },
    { n: '02', t: 'Servicios',  sub: 'Agrega los servicios a facturar' },
    { n: '03', t: 'Productos',  sub: 'Venta a cliente o consumo interno' },
    { n: '04', t: 'Pago',       sub: 'Método y desglose' },
    { n: '05', t: 'Confirmar',  sub: 'Revisa antes de registrar' },
  ];

  // Signals que reflejan la validez de los reactive forms (computed no detecta cambios en .valid)
  readonly formClienteValido = signal(false);
  readonly formVentaValido   = signal(false);

  // ── Pago mixto ────────────────────────────────────────
  readonly pagos = signal<PaymentEntry[]>([{ paymentMethodId: null, amount: 0 }]);

  // ── Filtros ───────────────────────────────────────────
  readonly filtroServicio = signal('');
  readonly categoriaServicio = signal('Todos');
  readonly filtroProductoVenta = signal('');
  readonly filtroProductoInterno = signal('');

  // ── Formularios ───────────────────────────────────────
  readonly formCliente = this.fb.group({
    documentType: ['CC'],
    documentNumber: [''],
    fullName: [''],
    email: ['', [Validators.email]],
    phone: [''],
  });

  readonly formVenta = this.fb.group({
    stylistId: [null as number | null, Validators.required],
    tipAmount: [0, [Validators.min(0)]],
    notes: [''],
  });

  readonly formAnular = this.fb.group({ reason: ['', Validators.required] });

  // ── Deducción ponderada por método de pago ────────────
  private readonly deductionPctPonderado = computed(() => {
    const pagos = this.pagos();
    const metodos = this.metodosPago();
    const totalPagado = pagos.reduce((s, p) => s + (p.amount || 0), 0);
    if (totalPagado === 0) return 0;
    const totalDed = pagos.reduce((s, p) => {
      const m = metodos.find(m => m.id === p.paymentMethodId);
      return s + (p.amount || 0) * (m?.deductionPercent ?? 0) / 100;
    }, 0);
    return (totalDed / totalPagado) * 100;
  });

  // ── Cálculo en tiempo real ────────────────────────────
  readonly calculo = computed<SaleCalculation>(() => {
    this.items(); // dependencia explícita
    return calculateSale({
      items: this.items(),
      tipAmount: this.formVenta.get('tipAmount')!.value ?? 0,
      deductionPct: this.deductionPctPonderado(),
      stylistCommPct: this.peluqueroSeleccionado()?.commissionPercent ?? 0,
    });
  });

  // ── Totales de pago ───────────────────────────────────
  readonly totalACobrar = computed(() =>
    this.calculo().grossServices + this.calculo().grossProducts + this.calculo().grossTip
  );

  readonly totalRecibido = computed(() =>
    this.pagos().reduce((s, p) => s + (p.amount || 0), 0)
  );

  readonly diferenciaPago = computed(() => this.totalACobrar() - this.totalRecibido());

  readonly pagosValidos = computed(() => {
    const pagos = this.pagos();
    return pagos.length > 0
      && pagos.every(p => p.paymentMethodId !== null && p.amount > 0)
      && Math.abs(this.diferenciaPago()) === 0;
  });

  readonly hayServicios = computed(() => this.items().some(i => i.type === 'Service'));

  // ── Step wizard ───────────────────────────────────────
  readonly step = signal(0);
  readonly ventaExitosa = signal(false);
  readonly folioVenta = signal('');
  readonly ventaExitosaData = signal<{ total: number; stylistTotal: number; salonTotal: number; stylistName: string } | null>(null);

  readonly puedeRegistrar = computed(() =>
    this.formVentaValido()
    && this.hayServicios()
    && this.pagosValidos()
    && !this.guardando()
  );

  // ── Catálogos filtrados ───────────────────────────────
  readonly categoriasServicio = computed(() => {
    const cats = [...new Set(this.servicios().map(s => s.category))];
    return ['Todos', ...cats];
  });

  readonly serviciosFiltrados = computed(() => {
    const f = this.filtroServicio().toLowerCase();
    const cat = this.categoriaServicio();
    return this.servicios().filter(s =>
      (cat === 'Todos' || s.category === cat) && (!f || s.name.toLowerCase().includes(f))
    );
  });

  readonly productosVentaFiltrados = computed(() => {
    const f = this.filtroProductoVenta().toLowerCase();
    return this.productos().filter(p => p.isForSale && (!f || p.name.toLowerCase().includes(f)));
  });

  readonly productosInternosFiltrados = computed(() => {
    const f = this.filtroProductoInterno().toLowerCase();
    return this.productos().filter(p => !f || p.name.toLowerCase().includes(f));
  });

  // ── Métodos disponibles para pago mixto (excluye ya usados) ──
  metodosPagoDisponibles(indexActual: number): PaymentMethodOption[] {
    const usados = this.pagos()
      .map((p, i) => i !== indexActual ? p.paymentMethodId : null)
      .filter(id => id !== null);
    return this.metodosPago().filter(m => !usados.includes(m.id));
  }

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarVentas();
    this.verificarCaja();

    // Sincronizar validez de forms como signals para que puedeRegistrar() reaccione
    this.formCliente.statusChanges.subscribe(s => this.formClienteValido.set(s === 'VALID'));
    this.formVenta.statusChanges.subscribe(s => this.formVentaValido.set(s === 'VALID'));

    this.formVenta.get('stylistId')!.valueChanges.subscribe(id => {
      this.peluqueroSeleccionado.set(this.peluqueros().find(p => p.id === id) ?? null);
    });
  }

  private cargarCatalogos(): void {
    this.ventasService.getServicios().subscribe({
      next: r => this.servicios.set(r.data),
      error: () => {}
    });
    this.ventasService.getProductos().subscribe({
      next: r => this.productos.set(r.data),
      error: () => {}
    });
    this.ventasService.getPeluqueros().subscribe({
      next: r => { this.peluqueros.set(r.data); this.cargandoCatalogos.set(false); },
      error: () => this.cargandoCatalogos.set(false)
    });
    this.ventasService.getMetodosPago().subscribe({
      next: r => this.metodosPago.set(r.data),
      error: () => {}
    });
  }

  private cargarVentas(): void {
    this.ventasService.getVentasHoy().subscribe(r => this.ventas.set(r.data));
  }

  private verificarCaja(): void {
    this.cajaService.getCajaActual().subscribe(r => this.cajaAbierta.set(!!r.data));
  }

  nuevaVenta(): void {
    this.resetFormulario();
    this.step.set(0);
    this.ventaExitosa.set(false);
    this.vista.set('nueva-venta');
    this.errorMsg.set(null);
  }

  volverALista(): void {
    this.vista.set('lista');
    this.errorMsg.set(null);
  }

  buscarCliente(): void {
    const doc = this.formCliente.get('documentNumber')!.value;
    if (!doc) return;
    this.buscandoCliente.set(true);
    this.ventasService.buscarCliente(doc).subscribe(r => {
      if (r.data) {
        this.clienteEncontrado.set(r.data);
        this.formCliente.patchValue(r.data);
      } else {
        this.clienteEncontrado.set(null);
        this.formCliente.patchValue({ fullName: '', email: '', phone: '' });
      }
      this.buscandoCliente.set(false);
    });
  }

  // ── Items ─────────────────────────────────────────────
  agregarServicio(servicio: ServiceOption): void {
    const existente = this.items().find(
      i => i.type === 'Service' && (i as SaleServiceItem).serviceId === servicio.id
    ) as SaleServiceItem | undefined;
    if (existente) {
      this.items.update(l => l.map(i => i === existente ? { ...existente, quantity: existente.quantity + 1 } : i));
    } else {
      this.items.update(l => [...l, { type: 'Service', serviceId: servicio.id, name: servicio.name, price: servicio.price, quantity: 1, hasSalonFee: servicio.hasSalonFee, salonFeePercent: servicio.salonFeePercent } as SaleServiceItem]);
    }
    this.sincronizarPagoConTotal();
  }

  agregarProductoVenta(producto: ProductOption): void {
    const existente = this.items().find(i => i.type === 'ProductSale' && (i as SaleProductItem).productId === producto.id) as SaleProductItem | undefined;
    if (existente) {
      this.items.update(l => l.map(i => i === existente ? { ...existente, quantity: existente.quantity + 1 } : i));
    } else {
      this.items.update(l => [...l, { type: 'ProductSale', productId: producto.id, name: producto.name, price: producto.salePrice, quantity: 1 } as SaleProductItem]);
    }
    this.sincronizarPagoConTotal();
  }

  agregarProductoInterno(producto: ProductOption): void {
    const existente = this.items().find(i => i.type === 'ProductInternal' && (i as SaleProductItem).productId === producto.id) as SaleProductItem | undefined;
    if (existente) {
      this.items.update(l => l.map(i => i === existente ? { ...existente, quantity: existente.quantity + 1 } : i));
    } else {
      this.items.update(l => [...l, { type: 'ProductInternal', productId: producto.id, name: producto.name, price: producto.purchasePrice, quantity: 1 } as SaleProductItem]);
    }
  }

  actualizarCantidad(item: SaleItem, qty: number): void {
    const q = Math.max(1, Math.floor(qty) || 1);
    this.items.update(l => l.map(i => i === item ? { ...i, quantity: q } : i));
    this.sincronizarPagoConTotal();
  }

  actualizarPrecio(item: SaleItem, precio: number): void {
    this.items.update(l => l.map(i => i === item ? { ...i, price: Math.max(0, precio || 0) } : i));
    this.sincronizarPagoConTotal();
  }

  quitarItem(item: SaleItem): void {
    this.items.update(l => l.filter(i => i !== item));
    this.sincronizarPagoConTotal();
  }

  // ── Pago mixto ────────────────────────────────────────
  agregarPago(): void {
    this.pagos.update(l => [...l, { paymentMethodId: null, amount: 0 }]);
  }

  quitarPago(index: number): void {
    if (this.pagos().length === 1) return;
    this.pagos.update(l => l.filter((_, i) => i !== index));
    this.redistribuirPagos();
  }

  actualizarPagoMetodo(index: number, methodId: number): void {
    this.pagos.update(l => l.map((p, i) => i === index ? { ...p, paymentMethodId: methodId } : p));
  }

  actualizarPagoMonto(index: number, amount: number): void {
    this.pagos.update(l => l.map((p, i) => i === index ? { ...p, amount: Math.max(0, amount || 0) } : p));
  }

  completarConDiferencia(index: number): void {
    const diff = this.diferenciaPago();
    if (diff === 0) return;
    const pago = this.pagos()[index];
    this.pagos.update(l => l.map((p, i) => i === index ? { ...p, amount: Math.max(0, pago.amount + diff) } : p));
  }

  private sincronizarPagoConTotal(): void {
    // Si solo hay un pago, autocompletar con el total
    if (this.pagos().length === 1) {
      const total = this.calcularTotalBruto();
      this.pagos.update(l => [{ ...l[0], amount: total }]);
    }
  }

  private redistribuirPagos(): void {
    if (this.pagos().length === 1) {
      this.sincronizarPagoConTotal();
    }
  }

  private calcularTotalBruto(): number {
    const items = this.items();
    return items.reduce((s, i) => i.type !== 'ProductInternal' ? s + i.price * i.quantity : s, 0)
      + (this.formVenta.get('tipAmount')!.value ?? 0);
  }

  nombreMetodoPago(id: number | null): string {
    if (!id) return '';
    return this.metodosPago().find(m => m.id === id)?.name ?? '';
  }

  // ── Guardar venta ─────────────────────────────────────
  guardarVenta(): void {
    if (!this.puedeRegistrar()) return;
    this.guardando.set(true);
    this.errorMsg.set(null);

    const cv = this.formCliente.value;
    const vv = this.formVenta.value;

    const expandir = <T>(type: string, mapper: (i: SaleItem) => T): T[] =>
      this.items().filter(i => i.type === type).flatMap(i =>
        Array.from({ length: i.quantity }, () => mapper(i))
      );

    // Clientes anónimos (sin documento) reciben un id único para evitar colisiones en BD
    const docNumber = cv.documentNumber?.trim() || `WALK-${Date.now()}`;
    const fullName  = cv.fullName?.trim()       || 'Consumidor final';
    const phone     = cv.phone?.trim()          || '';

    const request = {
      stylistId: vv.stylistId!,
      stylistName: this.peluqueroSeleccionado()?.fullName ?? '',
      commissionPercent: this.peluqueroSeleccionado()?.commissionPercent ?? 0,
      branchName: this.branchService.selectedBranch()?.name ?? undefined,
      clientDocumentType: cv.documentType || 'CC',
      clientDocumentNumber: docNumber,
      clientFullName: fullName,
      clientEmail: cv.email || undefined,
      clientPhone: phone || undefined,
      payments: this.pagos().filter(p => p.paymentMethodId && p.amount > 0).map(p => ({ paymentMethodId: p.paymentMethodId!, amount: p.amount })),
      tipAmount: vv.tipAmount ?? 0,
      notes: vv.notes ?? undefined,
      services: expandir('Service', i => ({ serviceId: (i as SaleServiceItem).serviceId, price: i.price })),
      productsSold: expandir('ProductSale', i => ({ productId: (i as SaleProductItem).productId, price: i.price })),
      productsInternal: expandir('ProductInternal', i => ({ productId: (i as SaleProductItem).productId, price: i.price })),
    };

    this.ventasService.crearVenta(request).subscribe({
      next: (r: any) => {
        this.cargarVentas();
        this.ventaExitosaData.set({
          total: this.totalACobrar(),
          stylistTotal: this.calculo().stylistTotal,
          salonTotal: this.calculo().salonTotal,
          stylistName: this.peluqueroSeleccionado()?.fullName ?? ''
        });
        this.folioVenta.set('V-' + Date.now());
        this.ventaExitosa.set(true);
        this.guardando.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al guardar la venta. Intenta de nuevo.');
        this.guardando.set(false);
      }
    });
  }

  // ── Anular ────────────────────────────────────────────
  iniciarAnulacion(venta: Sale): void {
    this.ventaAnular.set(venta);
    this.formAnular.reset();
    this.vista.set('anular');
  }

  confirmarAnulacion(): void {
    if (this.formAnular.invalid || !this.ventaAnular()) return;
    this.guardando.set(true);
    this.ventasService.anularVenta(this.ventaAnular()!.id, this.formAnular.value.reason!).subscribe({
      next: () => {
        this.cargarVentas();
        this.successMsg.set('Venta anulada correctamente');
        this.vista.set('lista');
        this.guardando.set(false);
        setTimeout(() => this.successMsg.set(null), 4000);
      },
      error: () => { this.errorMsg.set('Error al anular.'); this.guardando.set(false); }
    });
  }

  cancelarAnulacion(): void {
    this.ventaAnular.set(null);
    this.vista.set('lista');
  }

  // ── Step navigation ───────────────────────────────────
  canNext(): boolean {
    if (this.step() === 0) return !!this.peluqueroSeleccionado();
    if (this.step() === 1) return this.hayServicios();
    if (this.step() === 3) return this.pagosValidos();
    return true;
  }

  nextStep(): void { if (this.canNext()) this.step.update(s => Math.min(4, s + 1)); }
  prevStep(): void { this.step.update(s => Math.max(0, s - 1)); }

  seleccionarPeluquero(p: StylistOption): void {
    this.peluqueroSeleccionado.set(p);
    this.formVenta.get('stylistId')!.setValue(p.id);
  }

  nuevaVentaDesdeExito(): void {
    this.resetFormulario();
    this.step.set(0);
    this.ventaExitosa.set(false);
    this.ventaExitosaData.set(null);
  }

  // ── Helpers ───────────────────────────────────────────
  private resetFormulario(): void {
    this.formCliente.reset({ documentType: 'CC' });
    this.formVenta.reset({ tipAmount: 0 });
    this.formClienteValido.set(false);
    this.formVentaValido.set(false);
    this.items.set([]);
    this.pagos.set([{ paymentMethodId: null, amount: 0 }]);
    this.clienteEncontrado.set(null);
    this.peluqueroSeleccionado.set(null);
    this.filtroServicio.set('');
    this.categoriaServicio.set('Todos');
    this.filtroProductoVenta.set('');
    this.ventaExitosa.set(false);
    this.ventaExitosaData.set(null);
    this.folioVenta.set('');
  }

  itemsServicio()        { return this.items().filter(i => i.type === 'Service') as SaleServiceItem[]; }
  itemsProductoVenta()   { return this.items().filter(i => i.type === 'ProductSale') as SaleProductItem[]; }
  itemsProductoInterno() { return this.items().filter(i => i.type === 'ProductInternal') as SaleProductItem[]; }
  subtotalItem(item: SaleItem): number { return item.price * item.quantity; }

  servicioYaAgregado(id: number)       { return this.items().some(i => i.type === 'Service' && (i as SaleServiceItem).serviceId === id); }
  productoVentaYaAgregado(id: number)  { return this.items().some(i => i.type === 'ProductSale' && (i as SaleProductItem).productId === id); }
  productoInternoYaAgregado(id: number){ return this.items().some(i => i.type === 'ProductInternal' && (i as SaleProductItem).productId === id); }

  trackItem(_: number, item: SaleItem) {
    return item.type === 'Service' ? `S-${(item as SaleServiceItem).serviceId}` : `P-${item.type}-${(item as SaleProductItem).productId}`;
  }
  trackPago(index: number) { return index; }

  razonBotonDeshabilitado(): string {
    const pendientes: string[] = [];
    if (!this.hayServicios())                          pendientes.push('agrega al menos un servicio');
    if (!this.formClienteValido())                     pendientes.push('completa los datos del cliente');
    if (!this.formVentaValido() || !this.formVenta.get('stylistId')!.value) pendientes.push('selecciona un peluquero');
    if (this.pagos().some(p => !p.paymentMethodId))    pendientes.push('selecciona el método de pago');
    if (this.diferenciaPago() > 0)  pendientes.push(`falta ${this.diferenciaPago().toLocaleString('es-CO')} por asignar`);
    if (this.diferenciaPago() < 0)  pendientes.push(`excede el total en ${Math.abs(this.diferenciaPago()).toLocaleString('es-CO')}`);
    if (pendientes.length === 0) return '';
    const primero = pendientes[0].charAt(0).toUpperCase() + pendientes[0].slice(1);
    return pendientes.length === 1 ? primero : `${primero} (+${pendientes.length - 1} más)`;
  }
}
