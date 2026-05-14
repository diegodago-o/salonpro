import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { VentasService } from '../../core/services/ventas.service';
import { BranchService } from '../../core/services/branch.service';
import {
  ClientOption, PaymentEntry, PaymentMethodOption, ProductOption,
  SaleCalculation, SaleItem, SaleProductItem, SaleServiceItem,
  ServiceOption, StylistOption, Sale
} from '../../core/models/ventas.models';
import { calculateSale } from '../../core/utils/sale-calculator';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Vista = 'lista' | 'nueva-venta';

@Component({
  selector: 'app-historico',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, IconComponent],
  templateUrl: './historico.component.html',
  styleUrl: './historico.component.scss'
})
export class HistoricoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ventasService = inject(VentasService);
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
  readonly cargandoCatalogos = signal(true);
  readonly cargandoVentas = signal(false);
  readonly Math = Math;

  readonly clienteEncontrado = signal<ClientOption | null>(null);
  readonly buscandoCliente = signal(false);
  readonly items = signal<SaleItem[]>([]);
  readonly peluqueroSeleccionado = signal<StylistOption | null>(null);

  /** Propina como signal reactiva — sincronizada con formVenta.tipAmount */
  readonly tipAmountSig = signal(0);

  // ── Fecha histórica ────────────────────────────────────
  /** Fecha elegida: 'YYYY-MM-DD' */
  readonly historialDate = signal<string>(this.hoy());
  /** Hora elegida: 'HH:MM' */
  readonly historialTime = signal<string>('12:00');

  /** ISO 8601 de la fecha+hora histórica (en local, sin conversión — el backend convierte a UTC) */
  readonly saleDateTimeISO = computed<string | null>(() => {
    const d = this.historialDate();
    const t = this.historialTime();
    if (!d || !t) return null;
    return `${d}T${t}:00`;
  });

  /** true si la fecha elegida es válida: no futura, no antes de 2025-01-01 */
  readonly historialDateValida = computed(() => {
    const iso = this.saleDateTimeISO();
    if (!iso) return false;
    const dt = new Date(iso);
    if (isNaN(dt.getTime())) return false;
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + 5); // margen de 5 min
    const minDate = new Date('2025-01-01T00:00:00');
    return dt <= ahora && dt >= minDate;
  });

  /** Texto formateado para mostrar en el banner */
  readonly fechaFormateada = computed(() => {
    const iso = this.saleDateTimeISO();
    if (!iso) return '—';
    const dt = new Date(iso);
    return dt.toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  });

  // ── Filtro lista ──────────────────────────────────────
  readonly filtroAnio  = signal<string>(new Date().getFullYear().toString());
  readonly filtroMes   = signal<string>(''); // '' = todos

  // ── Wizard steps (6 pasos) ────────────────────────────
  readonly wizardSteps = [
    { n: '00', t: 'Fecha',      sub: 'Elige la fecha y hora de la venta histórica' },
    { n: '01', t: 'Colaborador', sub: 'Selecciona el colaborador que prestó el servicio' },
    { n: '02', t: 'Servicios',  sub: 'Agrega los servicios a facturar' },
    { n: '03', t: 'Productos',  sub: 'Venta a cliente o consumo interno' },
    { n: '04', t: 'Pago',       sub: 'Método y desglose' },
    { n: '05', t: 'Confirmar',  sub: 'Revisa antes de registrar' },
  ];

  readonly formClienteValido = signal(false);
  readonly formVentaValido   = signal(false);

  // ── Pago mixto ────────────────────────────────────────
  readonly pagos = signal<PaymentEntry[]>([{ paymentMethodId: null, amount: 0 }]);

  // ── Filtros catálogo ──────────────────────────────────
  readonly filtroServicio       = signal('');
  readonly categoriaServicio    = signal('Todos');
  readonly filtroProductoVenta  = signal('');

  // ── Formularios ───────────────────────────────────────
  readonly formCliente = this.fb.group({
    documentType:   ['CC'],
    documentNumber: [''],
    fullName:       [''],
    email:          ['', [Validators.email]],
    phone:          [''],
  });

  readonly formVenta = this.fb.group({
    stylistId:  [null as number | null, Validators.required],
    tipAmount:  [0, [Validators.min(0)]],
    notes:      [''],
  });

  // ── Computados financieros ────────────────────────────
  readonly deductionTotalAmount = computed(() =>
    Math.round(this.pagos().reduce((sum, p) => {
      const m = this.metodosPago().find(m => m.id === p.paymentMethodId);
      return sum + (p.amount || 0) * (m?.deductionPercent ?? 0) / 100;
    }, 0))
  );

  readonly hasCashPayment = computed(() =>
    this.pagos().some(p => {
      const m = this.metodosPago().find(m => m.id === p.paymentMethodId);
      return m?.name.toLowerCase().includes('efectivo') ?? false;
    })
  );

  readonly calculo = computed<SaleCalculation>(() =>
    calculateSale({
      items: this.items(),
      tipAmount: this.tipAmountSig(),
      deductionAmount: this.deductionTotalAmount(),
      stylistCommPct: this.peluqueroSeleccionado()?.commissionPercent ?? 0,
    })
  );

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

  readonly deduccionesPorPago = computed(() =>
    this.pagos()
      .filter(p => p.paymentMethodId !== null && p.amount > 0)
      .map(p => {
        const m = this.metodosPago().find(m => m.id === p.paymentMethodId);
        if (!m || !m.hasDeduction || m.deductionPercent === 0) return null;
        return { name: m.name, pct: m.deductionPercent, amount: Math.round(p.amount * m.deductionPercent / 100) };
      })
      .filter((d): d is { name: string; pct: number; amount: number } => d !== null)
  );

  readonly baseNeta = computed(() => this.totalACobrar() - this.calculo().totalDeductions);

  readonly desgloseItems = computed(() => {
    const totalDed  = this.deductionTotalAmount();
    const grossItems = this.items()
      .filter(i => i.type !== 'ProductInternal')
      .reduce((s, i) => s + i.price * i.quantity, 0);
    const sPct = (this.peluqueroSeleccionado()?.commissionPercent ?? 0) / 100;

    return this.items()
      .filter(i => i.type !== 'ProductInternal')
      .map(item => {
        const subtotal = item.price * item.quantity;
        const frac    = grossItems > 0 ? subtotal / grossItems : 0;
        const netBase = Math.round(subtotal - totalDed * frac);

        if (item.type === 'Service') {
          const svc = item as SaleServiceItem;
          let stylistAmt: number, salonAmt: number, feeAmt = 0;
          if (svc.hasSalonFee && svc.salonFeePercent > 0) {
            feeAmt     = Math.round(netBase * svc.salonFeePercent / 100);
            const rem  = netBase - feeAmt;
            stylistAmt = Math.round(rem * sPct);
            salonAmt   = Math.round(rem * (1 - sPct)) + feeAmt;
          } else {
            stylistAmt = Math.round(netBase * sPct);
            salonAmt   = Math.round(netBase * (1 - sPct));
          }
          return { name: item.name, type: 'Servicio', subtotal, netBase,
            stylistPct: this.peluqueroSeleccionado()?.commissionPercent ?? 0,
            stylistAmt, salonAmt, hasFee: svc.hasSalonFee && svc.salonFeePercent > 0,
            feeAmt, feePct: svc.salonFeePercent };
        } else {
          const prod     = item as SaleProductItem;
          const prodSPct = (prod.stylistCommissionPercent ?? 10) / 100;
          return { name: item.name, type: 'Producto', subtotal, netBase,
            stylistPct: prod.stylistCommissionPercent ?? 10,
            stylistAmt: Math.round(netBase * prodSPct),
            salonAmt: Math.round(netBase * (1 - prodSPct)),
            hasFee: false, feeAmt: 0, feePct: 0 };
        }
      });
  });

  // ── Step wizard ───────────────────────────────────────
  readonly step = signal(0);
  readonly ventaExitosa = signal(false);
  readonly folioVenta = signal('');
  readonly ventaExitosaData = signal<{ total: number; stylistTotal: number; salonTotal: number; stylistName: string; fecha: string } | null>(null);

  readonly puedeRegistrar = computed(() =>
    this.formVentaValido()
    && this.hayServicios()
    && this.pagosValidos()
    && this.historialDateValida()
    && !this.guardando()
  );

  // ── Catálogos filtrados ───────────────────────────────
  readonly categoriasServicio = computed(() => ['Todos', ...new Set(this.servicios().map(s => s.category))]);

  readonly serviciosFiltrados = computed(() => {
    const f   = this.filtroServicio().toLowerCase();
    const cat = this.categoriaServicio();
    return this.servicios().filter(s =>
      (cat === 'Todos' || s.category === cat) && (!f || s.name.toLowerCase().includes(f))
    );
  });

  readonly productosVentaFiltrados = computed(() => {
    const f = this.filtroProductoVenta().toLowerCase();
    return this.productos().filter(p => p.isForSale && (!f || p.name.toLowerCase().includes(f)));
  });

  readonly productosInternosFiltrados = computed(() =>
    this.productos().filter(() => true)
  );

  metodosPagoDisponibles(indexActual: number): PaymentMethodOption[] {
    const usados = this.pagos()
      .map((p, i) => i !== indexActual ? p.paymentMethodId : null)
      .filter(id => id !== null);
    return this.metodosPago().filter(m => !usados.includes(m.id));
  }

  constructor() {
    toObservable(this.branchService.selectedBranch)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargarCatalogos());

    toObservable(this.hasCashPayment)
      .pipe(takeUntilDestroyed())
      .subscribe(hasCash => {
        const ctrl = this.formVenta.get('tipAmount')!;
        if (hasCash) {
          ctrl.setValue(0, { emitEvent: false });
          ctrl.disable({ emitEvent: false });
          this.tipAmountSig.set(0);
          this.sincronizarPagoConTotal();
        } else {
          ctrl.enable({ emitEvent: false });
        }
      });
  }

  ngOnInit(): void {
    this.cargarVentasHistoricas();

    this.formCliente.statusChanges.subscribe(s => this.formClienteValido.set(s === 'VALID'));
    this.formVenta.statusChanges.subscribe(s => this.formVentaValido.set(s === 'VALID'));

    this.formVenta.get('stylistId')!.valueChanges.subscribe(id => {
      this.peluqueroSeleccionado.set(this.peluqueros().find(p => p.id === id) ?? null);
    });

    this.formVenta.get('tipAmount')!.valueChanges.subscribe(v => {
      this.tipAmountSig.set(typeof v === 'number' ? Math.max(0, v) : 0);
      this.sincronizarPagoConTotal();
    });
  }

  private cargarCatalogos(): void {
    const branchId = this.branchService.currentBranchId;
    this.ventasService.getServicios(branchId).subscribe({ next: r => this.servicios.set(r.data), error: () => {} });
    this.ventasService.getProductos(branchId).subscribe({ next: r => this.productos.set(r.data), error: () => {} });
    this.ventasService.getPeluqueros(branchId).subscribe({
      next: r => { this.peluqueros.set(r.data); this.cargandoCatalogos.set(false); },
      error: () => this.cargandoCatalogos.set(false)
    });
    this.ventasService.getMetodosPago().subscribe({ next: r => this.metodosPago.set(r.data), error: () => {} });
  }

  cargarVentasHistoricas(): void {
    const anio = this.filtroAnio();
    const mes  = this.filtroMes();
    const branch = this.branchService.selectedBranch();
    let from: string, to: string;
    if (mes) {
      const m = mes.padStart(2, '0');
      const lastDay = new Date(+anio, +mes, 0).getDate();
      from = `${anio}-${m}-01`;
      to   = `${anio}-${m}-${lastDay}`;
    } else {
      from = `${anio}-01-01`;
      to   = `${anio}-12-31`;
    }
    this.cargandoVentas.set(true);
    this.ventasService.getVentas(from, to, branch?.id, branch?.name).subscribe({
      next: r => { this.ventas.set(r.data); this.cargandoVentas.set(false); },
      error: () => this.cargandoVentas.set(false)
    });
  }

  nuevaVenta(): void {
    this.resetFormulario();
    this.step.set(0);
    this.ventaExitosa.set(false);
    this.errorMsg.set(null);
    this.vista.set('nueva-venta');
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
      if (r.data) { this.clienteEncontrado.set(r.data); this.formCliente.patchValue(r.data); }
      else { this.clienteEncontrado.set(null); this.formCliente.patchValue({ fullName: '', email: '', phone: '' }); }
      this.buscandoCliente.set(false);
    });
  }

  // ── Items ─────────────────────────────────────────────
  agregarServicio(servicio: ServiceOption): void {
    const existente = this.items().find(i => i.type === 'Service' && (i as SaleServiceItem).serviceId === servicio.id) as SaleServiceItem | undefined;
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
      this.items.update(l => [...l, { type: 'ProductSale', productId: producto.id, name: producto.name, price: producto.salePrice, quantity: 1, stylistCommissionPercent: producto.stylistCommissionPercent ?? 10 } as SaleProductItem]);
    }
    this.sincronizarPagoConTotal();
  }

  agregarProductoInterno(producto: ProductOption): void {
    const existente = this.items().find(i => i.type === 'ProductInternal' && (i as SaleProductItem).productId === producto.id) as SaleProductItem | undefined;
    if (existente) {
      this.items.update(l => l.map(i => i === existente ? { ...existente, quantity: existente.quantity + 1 } : i));
    } else {
      this.items.update(l => [...l, { type: 'ProductInternal', productId: producto.id, name: producto.name, price: producto.purchasePrice, quantity: 1, stylistCommissionPercent: 0 } as SaleProductItem]);
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
  agregarPago(): void { this.pagos.update(l => [...l, { paymentMethodId: null, amount: 0 }]); }
  quitarPago(index: number): void {
    if (this.pagos().length === 1) return;
    this.pagos.update(l => l.filter((_, i) => i !== index));
    if (this.pagos().length === 1) this.sincronizarPagoConTotal();
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
    if (this.pagos().length === 1) {
      const total = this.calcularTotalBruto();
      this.pagos.update(l => [{ ...l[0], amount: total }]);
    }
  }

  private calcularTotalBruto(): number {
    return this.items().reduce((s, i) => i.type !== 'ProductInternal' ? s + i.price * i.quantity : s, 0)
      + this.tipAmountSig();
  }

  nombreMetodoPago(id: number | null): string {
    if (!id) return '';
    return this.metodosPago().find(m => m.id === id)?.name ?? '';
  }

  // ── Guardar venta histórica ───────────────────────────
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

    const docNumber = cv.documentNumber?.trim() || `WALK-${Date.now()}`;
    const fullName  = cv.fullName?.trim()       || 'Consumidor final';

    const request = {
      stylistId:           vv.stylistId!,
      stylistName:         this.peluqueroSeleccionado()?.fullName ?? '',
      commissionPercent:   this.peluqueroSeleccionado()?.commissionPercent ?? 0,
      branchId:            this.branchService.selectedBranch()?.id ?? undefined,
      branchName:          this.branchService.selectedBranch()?.name ?? undefined,
      clientDocumentType:  cv.documentType || 'CC',
      clientDocumentNumber: docNumber,
      clientFullName:      fullName,
      clientEmail:         cv.email   || undefined,
      clientPhone:         cv.phone?.trim() || undefined,
      payments: this.pagos().filter(p => p.paymentMethodId && p.amount > 0)
        .map(p => ({ paymentMethodId: p.paymentMethodId!, amount: p.amount })),
      tipAmount:   vv.tipAmount ?? 0,
      notes:       vv.notes ?? undefined,
      services:    expandir('Service',         i => ({ serviceId: (i as SaleServiceItem).serviceId, price: i.price })),
      productsSold:    expandir('ProductSale', i => ({ productId: (i as SaleProductItem).productId, price: i.price })),
      productsInternal: expandir('ProductInternal', i => ({ productId: (i as SaleProductItem).productId, price: i.price })),
      saleDateTime: this.saleDateTimeISO() ?? undefined,
    };

    this.ventasService.crearVenta(request).subscribe({
      next: () => {
        this.ventaExitosaData.set({
          total:       this.totalACobrar(),
          stylistTotal: this.calculo().stylistTotal,
          salonTotal:   this.calculo().salonTotal,
          stylistName:  this.peluqueroSeleccionado()?.fullName ?? '',
          fecha:        this.fechaFormateada(),
        });
        this.folioVenta.set('H-' + Date.now());
        this.ventaExitosa.set(true);
        this.guardando.set(false);
        this.cargarVentasHistoricas();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Error al guardar la venta histórica. Intenta de nuevo.';
        this.errorMsg.set(msg);
        this.guardando.set(false);
      }
    });
  }

  // ── Step navigation ───────────────────────────────────
  canNext(): boolean {
    if (this.step() === 0) return this.historialDateValida();
    if (this.step() === 1) return !!this.peluqueroSeleccionado();
    if (this.step() === 2) return this.hayServicios();
    if (this.step() === 4) return this.pagosValidos();
    return true;
  }

  nextStep(): void { if (this.canNext()) this.step.update(s => Math.min(5, s + 1)); }
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
    this.ventaExitosa.set(false);
    this.ventaExitosaData.set(null);
    this.folioVenta.set('');
    // Mantener la fecha elegida para facilitar carga de múltiples ventas del mismo día
  }

  itemsServicio()        { return this.items().filter(i => i.type === 'Service') as SaleServiceItem[]; }
  itemsProductoVenta()   { return this.items().filter(i => i.type === 'ProductSale') as SaleProductItem[]; }
  itemsProductoInterno() { return this.items().filter(i => i.type === 'ProductInternal') as SaleProductItem[]; }
  subtotalItem(item: SaleItem): number { return item.price * item.quantity; }

  servicioYaAgregado(id: number)        { return this.items().some(i => i.type === 'Service' && (i as SaleServiceItem).serviceId === id); }
  productoVentaYaAgregado(id: number)   { return this.items().some(i => i.type === 'ProductSale' && (i as SaleProductItem).productId === id); }
  productoInternoYaAgregado(id: number) { return this.items().some(i => i.type === 'ProductInternal' && (i as SaleProductItem).productId === id); }

  trackItem(_: number, item: SaleItem) {
    return item.type === 'Service' ? `S-${(item as SaleServiceItem).serviceId}` : `P-${item.type}-${(item as SaleProductItem).productId}`;
  }
  trackPago(index: number) { return index; }

  anios(): string[] {
    const current = new Date().getFullYear();
    return Array.from({ length: current - 2024 }, (_, i) => String(2025 + i));
  }

  meses(): { label: string; value: string }[] {
    return [
      { label: 'Todos', value: '' },
      { label: 'Enero', value: '1' }, { label: 'Febrero', value: '2' }, { label: 'Marzo', value: '3' },
      { label: 'Abril', value: '4' }, { label: 'Mayo', value: '5' }, { label: 'Junio', value: '6' },
      { label: 'Julio', value: '7' }, { label: 'Agosto', value: '8' }, { label: 'Septiembre', value: '9' },
      { label: 'Octubre', value: '10' }, { label: 'Noviembre', value: '11' }, { label: 'Diciembre', value: '12' },
    ];
  }

  private hoy(): string {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  get maxDate(): string { return this.hoy(); }
  get minDate(): string { return '2025-01-01'; }
}
