import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { VentasService } from '../../core/services/ventas.service';
import { TicketService } from '../../core/services/ticket.service';
import { BranchService } from '../../core/services/branch.service';
import {
  ClientOption, PaymentEntry, PaymentMethodOption, ProductOption,
  SaleCalculation, SaleItem, SaleProductItem, SaleServiceItem,
  ServiceOption, StylistOption, Sale, SaleStatus
} from '../../core/models/ventas.models';
import { CreateTicketRequest } from '../../core/models/ticket.models';
import { calculateSale } from '../../core/utils/sale-calculator';
import { colombiaEndOfDay, colombiaStartOfDay, todayColombia } from '../../core/utils/colombia-time';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Vista = 'lista' | 'nueva-venta';

interface GrupoHistorico {
  stylist: StylistOption | null;
  items: SaleItem[];
}

interface VentaAgrupada {
  id: number;
  saleDateTime: string;
  clientName: string;
  stylistNames: string;
  paymentMethodName: string;
  grossTotal: number;
  stylistTotal: number;
  status: SaleStatus;
  ventas: Sale[];
}

@Component({
  selector: 'app-historico',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, IconComponent],
  templateUrl: './historico.component.html',
  styleUrl: './historico.component.scss'
})
export class HistoricoComponent implements OnInit {
  private readonly fb             = inject(FormBuilder);
  private readonly ventasService  = inject(VentasService);
  private readonly ticketService  = inject(TicketService);
  private readonly branchService  = inject(BranchService);

  readonly vista      = signal<Vista>('lista');
  readonly guardando  = signal(false);
  readonly errorMsg   = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);

  // ── Catálogos ─────────────────────────────────────────
  readonly servicios    = signal<ServiceOption[]>([]);
  readonly productos    = signal<ProductOption[]>([]);
  readonly peluqueros   = signal<StylistOption[]>([]);
  readonly metodosPago  = signal<PaymentMethodOption[]>([]);

  readonly ventas            = signal<Sale[]>([]);
  readonly cargandoCatalogos = signal(true);
  readonly cargandoVentas    = signal(false);

  readonly ventasAgrupadas = computed(() => this.agruparVentas(this.ventas()));
  readonly Math = Math;

  readonly clienteEncontrado = signal<ClientOption | null>(null);
  readonly buscandoCliente   = signal(false);

  // ── Multi-colaborador ─────────────────────────────────
  readonly grupos         = signal<GrupoHistorico[]>([{ stylist: null, items: [] }]);
  readonly grupoActualIdx = signal(0);
  readonly grupoActual    = computed(() => this.grupos()[this.grupoActualIdx()]);
  readonly peluqueroSeleccionado = computed(() => this.grupoActual().stylist);

  /** Propina como signal reactiva — sincronizada con formVenta.tipAmount */
  readonly tipAmountSig  = signal(0);
  readonly tipGrupoIdx   = signal(0);

  // ── Fecha histórica ────────────────────────────────────
  readonly historialDate = signal<string>(this.hoy());
  readonly historialTime = signal<string>('12:00');

  readonly saleDateTimeISO = computed<string | null>(() => {
    const d = this.historialDate();
    const t = this.historialTime();
    if (!d || !t) return null;
    return `${d}T${t}:00`;
  });

  readonly historialDateValida = computed(() => {
    const iso = this.saleDateTimeISO();
    if (!iso) return false;
    const dt = new Date(iso);
    if (isNaN(dt.getTime())) return false;
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + 5);
    const minDate = new Date('2025-01-01T00:00:00');
    return dt <= ahora && dt >= minDate;
  });

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
  readonly filtroAnio = signal<string>(new Date().getFullYear().toString());
  readonly filtroMes  = signal<string>('');

  // ── Wizard steps (6 pasos) ────────────────────────────
  readonly wizardSteps = [
    { n: '00', t: 'Fecha',       sub: 'Elige la fecha y hora de la venta histórica' },
    { n: '01', t: 'Colaborador', sub: 'Selecciona el colaborador que prestó el servicio' },
    { n: '02', t: 'Servicios',   sub: 'Agrega los servicios a facturar' },
    { n: '03', t: 'Productos',   sub: 'Venta a cliente o consumo interno' },
    { n: '04', t: 'Pago',        sub: 'Método y desglose' },
    { n: '05', t: 'Confirmar',   sub: 'Revisa antes de registrar' },
  ];

  // ── Pago mixto ────────────────────────────────────────
  readonly pagos = signal<PaymentEntry[]>([{ paymentMethodId: null, amount: 0 }]);

  // ── Filtros catálogo ──────────────────────────────────
  readonly filtroServicio      = signal('');
  readonly categoriaServicio   = signal('Todos');
  readonly filtroProductoVenta = signal('');
  readonly buscadorProducto    = signal('');

  // ── Formularios ───────────────────────────────────────
  readonly formCliente = this.fb.group({
    documentType:   ['CC'],
    documentNumber: [''],
    fullName:       [''],
    email:          ['', [Validators.email]],
    phone:          [''],
  });

  readonly formVenta = this.fb.group({
    tipAmount: [0, [Validators.min(0)]],
    notes:     [''],
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

  /** Total bruto de ítems cobrables (excluye consumo interno) de TODOS los grupos */
  readonly totalBrutoItems = computed(() =>
    this.grupos().reduce((total, g) =>
      total + g.items.filter(i => i.type !== 'ProductInternal')
        .reduce((s, i) => s + i.price * i.quantity, 0), 0)
  );

  readonly totalACobrar = computed(() => this.totalBrutoItems() + this.tipAmountSig());

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

  /** Al menos un servicio en cualquier grupo */
  readonly hayServicios = computed(() =>
    this.grupos().some(g => g.items.some(i => i.type === 'Service'))
  );

  /** Servicio en el grupo actualmente en edición */
  readonly hayServiciosGrupoActual = computed(() =>
    this.grupoActual().items.some(i => i.type === 'Service')
  );

  /** Calculo financiero agregado de todos los grupos (sidebar y paso 4) */
  readonly calculo = computed<SaleCalculation>(() => {
    const grupos = this.grupos();
    const totalWithTip = this.totalACobrar();
    const dedTotal = this.deductionTotalAmount();

    if (grupos.length === 0)
      return calculateSale({ items: [], tipAmount: 0, deductionAmount: 0, stylistCommPct: 0 });

    if (grupos.length === 1)
      return calculateSale({
        items: grupos[0].items,
        tipAmount: this.tipAmountSig(),
        deductionAmount: dedTotal,
        stylistCommPct: grupos[0].stylist?.commissionPercent ?? 0,
      });

    // Multi-grupo: suma de cálculos proporcionales
    let stylist = 0, salon = 0, svc = 0, prod = 0, tip = 0, ded = 0;
    for (let i = 0; i < grupos.length; i++) {
      const c = this.calcularParaGrupo(i, totalWithTip, dedTotal);
      stylist += c.stylistTotal; salon += c.salonTotal;
      svc += c.grossServices; prod += c.grossProducts;
      tip += c.grossTip; ded += c.totalDeductions;
    }
    return {
      grossServices: svc, grossProducts: prod, grossTip: tip, internalConsumption: 0,
      deductionPct: 0, deductionServices: 0, deductionProducts: 0, deductionTip: 0,
      totalDeductions: ded,
      baseServices: svc, baseProducts: prod, netTip: tip,
      stylistCommPct: 0, salonFeeServices: 0,
      stylistCommServices: 0, salonCommServices: 0,
      stylistCommProducts: 0, salonCommProducts: 0,
      stylistTotal: stylist, salonTotal: salon,
    };
  });

  readonly baseNeta = computed(() => this.totalACobrar() - this.calculo().totalDeductions);

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

  // ── Step wizard ───────────────────────────────────────
  readonly step         = signal(0);
  readonly ventaExitosa = signal(false);
  readonly folioVenta   = signal('');
  readonly ventaExitosaData = signal<{
    total: number; gruposNombres: string; fecha: string;
  } | null>(null);

  readonly puedeRegistrar = computed(() =>
    this.grupos().length > 0
    && this.grupos().every(g => g.stylist !== null && g.items.some(i => i.type === 'Service'))
    && this.pagosValidos()
    && this.historialDateValida()
    && !this.guardando()
  );

  // ── Catálogos filtrados ───────────────────────────────
  readonly categoriasServicio = computed(() =>
    ['Todos', ...new Set(this.servicios().map(s => s.category))]
  );

  readonly serviciosFiltrados = computed(() => {
    const f   = this.filtroServicio().toLowerCase();
    const cat = this.categoriaServicio();
    return this.servicios().filter(s =>
      (cat === 'Todos' || s.category === cat) && (!f || s.name.toLowerCase().includes(f))
    );
  });

  readonly productosVentaFiltrados = computed(() => {
    const busqueda = this.buscadorProducto().toLowerCase();
    return this.productos().filter(p => p.isForSale && (!busqueda || p.name.toLowerCase().includes(busqueda)));
  });

  readonly productosInternosFiltrados = computed(() => {
    const busqueda = this.buscadorProducto().toLowerCase();
    return this.productos().filter(p => !busqueda || p.name.toLowerCase().includes(busqueda));
  });

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
    const anio   = this.filtroAnio();
    const mes    = this.filtroMes();
    const branch = this.branchService.selectedBranch();
    let from: string, to: string;
    if (mes) {
      const m       = mes.padStart(2, '0');
      const lastDay = new Date(+anio, +mes, 0).getDate();
      from = `${anio}-${m}-01`;
      to   = `${anio}-${m}-${lastDay}`;
    } else {
      from = `${anio}-01-01`;
      to   = `${anio}-12-31`;
    }
    this.cargandoVentas.set(true);
    this.ventasService.getVentas(colombiaStartOfDay(from), colombiaEndOfDay(to), branch?.id, branch?.name).subscribe({
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

  // ── Multi-colaborador ─────────────────────────────────
  agregarGrupo(): void {
    this.grupos.update(gs => [...gs, { stylist: null, items: [] }]);
    this.grupoActualIdx.set(this.grupos().length - 1);
    this.filtroServicio.set('');
    this.categoriaServicio.set('Todos');
    this.filtroProductoVenta.set('');
    this.buscadorProducto.set('');
    this.step.set(1);
  }

  eliminarGrupoActual(): void {
    const idx = this.grupoActualIdx();
    if (this.grupos().length <= 1) return;
    this.grupos.update(gs => gs.filter((_, i) => i !== idx));
    const newIdx = Math.max(0, idx - 1);
    this.grupoActualIdx.set(newIdx);
    this.step.set(3);
  }

  private setItemsGrupoActual(items: SaleItem[]): void {
    const idx = this.grupoActualIdx();
    this.grupos.update(gs => gs.map((g, i) => i === idx ? { ...g, items } : g));
  }

  // ── Items del grupo actual ────────────────────────────
  agregarServicio(servicio: ServiceOption): void {
    const current   = this.grupoActual().items;
    const existente = current.find(i => i.type === 'Service' && (i as SaleServiceItem).serviceId === servicio.id) as SaleServiceItem | undefined;
    if (existente) {
      this.setItemsGrupoActual(current.map(i => i === existente ? { ...existente, quantity: existente.quantity + 1 } : i));
    } else {
      this.setItemsGrupoActual([...current, { type: 'Service', serviceId: servicio.id, name: servicio.name, price: servicio.price, quantity: 1, hasSalonFee: servicio.hasSalonFee, salonFeePercent: servicio.salonFeePercent } as SaleServiceItem]);
    }
    this.sincronizarPagoConTotal();
  }

  agregarProductoVenta(producto: ProductOption): void {
    const current   = this.grupoActual().items;
    const existente = current.find(i => i.type === 'ProductSale' && (i as SaleProductItem).productId === producto.id) as SaleProductItem | undefined;
    if (existente) {
      this.setItemsGrupoActual(current.map(i => i === existente ? { ...existente, quantity: existente.quantity + 1 } : i));
    } else {
      this.setItemsGrupoActual([...current, { type: 'ProductSale', productId: producto.id, name: producto.name, price: producto.salePrice, quantity: 1, stylistCommissionPercent: producto.stylistCommissionPercent ?? 10 } as SaleProductItem]);
    }
    this.sincronizarPagoConTotal();
  }

  agregarProductoInterno(producto: ProductOption): void {
    const current   = this.grupoActual().items;
    const existente = current.find(i => i.type === 'ProductInternal' && (i as SaleProductItem).productId === producto.id) as SaleProductItem | undefined;
    if (existente) {
      this.setItemsGrupoActual(current.map(i => i === existente ? { ...existente, quantity: existente.quantity + 1 } : i));
    } else {
      this.setItemsGrupoActual([...current, { type: 'ProductInternal', productId: producto.id, name: producto.name, price: producto.purchasePrice, quantity: 1, stylistCommissionPercent: 0 } as SaleProductItem]);
    }
  }

  actualizarCantidad(item: SaleItem, qty: number): void {
    const q = Math.max(1, Math.floor(qty) || 1);
    this.setItemsGrupoActual(this.grupoActual().items.map(i => i === item ? { ...i, quantity: q } : i));
    this.sincronizarPagoConTotal();
  }

  actualizarPrecio(item: SaleItem, precio: number): void {
    this.setItemsGrupoActual(this.grupoActual().items.map(i => i === item ? { ...i, price: Math.max(0, precio || 0) } : i));
    this.sincronizarPagoConTotal();
  }

  quitarItem(item: SaleItem): void {
    this.setItemsGrupoActual(this.grupoActual().items.filter(i => i !== item));
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
      const total = this.totalACobrar();
      this.pagos.update(l => [{ ...l[0], amount: total }]);
    }
  }

  nombreMetodoPago(id: number | null): string {
    if (!id) return '';
    return this.metodosPago().find(m => m.id === id)?.name ?? '';
  }

  // ── Guardar venta histórica (multi-colaborador via /tickets) ──
  guardarVenta(): void {
    if (!this.puedeRegistrar()) return;
    this.guardando.set(true);
    this.errorMsg.set(null);

    const cv = this.formCliente.value;

    const expandir = <T>(items: SaleItem[], type: string, mapper: (i: SaleItem) => T): T[] =>
      items.filter(i => i.type === type).flatMap(i =>
        Array.from({ length: i.quantity }, () => mapper(i))
      );

    const request: CreateTicketRequest = {
      clientDocumentType:   cv.documentType || 'CC',
      clientDocumentNumber: cv.documentNumber?.trim() || '222222',
      clientFullName:       cv.fullName?.trim()       || 'Consumidor Final',
      clientEmail:          cv.email   || undefined,
      clientPhone:          cv.phone?.trim() || undefined,
      branchId:             this.branchService.selectedBranch()?.id ?? undefined,
      branchName:           this.branchService.selectedBranch()?.name ?? undefined,
      payments: this.pagos().filter(p => p.paymentMethodId && p.amount > 0)
        .map(p => ({ paymentMethodId: p.paymentMethodId!, amount: p.amount })),
      tipAmount:      this.tipAmountSig(),
      tipGroupIndex:  this.grupos().length > 1 ? this.tipGrupoIdx() : 0,
      notes:          this.formVenta.value.notes ?? undefined,
      saleDateTime:   this.saleDateTimeISO() ?? undefined,
      groups: this.grupos().map(g => ({
        stylistId:         g.stylist!.id,
        stylistName:       g.stylist!.fullName,
        commissionPercent: g.stylist!.commissionPercent,
        services:     expandir(g.items, 'Service',          i => ({ serviceId: (i as SaleServiceItem).serviceId, price: i.price })),
        productsSold: expandir(g.items, 'ProductSale',      i => ({ productId: (i as SaleProductItem).productId, price: i.price })),
        productsInternal: expandir(g.items, 'ProductInternal', i => ({ productId: (i as SaleProductItem).productId, price: i.price })),
      })),
    };

    this.ticketService.crearTicket(request).subscribe({
      next: () => {
        this.ventaExitosaData.set({
          total: this.totalACobrar(),
          gruposNombres: this.grupos().map(g => g.stylist?.fullName ?? '').join(' · '),
          fecha: this.fechaFormateada(),
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
    if (this.step() === 1) return !!this.grupoActual().stylist;
    if (this.step() === 2) return this.hayServiciosGrupoActual();
    if (this.step() === 4) return this.pagosValidos();
    return true;
  }

  nextStep(): void {
    if (this.canNext()) {
      this.step.update(s => Math.min(5, s + 1));
      // Resetear filtros al volver al paso de servicios para otro grupo
      if (this.step() === 2) {
        this.filtroServicio.set('');
        this.categoriaServicio.set('Todos');
      }
    }
  }

  prevStep(): void {
    // Desde colaborador de un grupo adicional → volver a productos del grupo anterior
    if (this.step() === 1 && this.grupoActualIdx() > 0) {
      this.grupoActualIdx.set(this.grupoActualIdx() - 1);
      this.step.set(3);
      return;
    }
    // Desde pago → situar grupoActual en el último grupo
    if (this.step() === 4) {
      this.grupoActualIdx.set(this.grupos().length - 1);
    }
    this.step.update(s => Math.max(0, s - 1));
  }

  seleccionarPeluquero(p: StylistOption): void {
    const idx = this.grupoActualIdx();
    this.grupos.update(gs => gs.map((g, i) => i === idx ? { ...g, stylist: p } : g));
  }

  nuevaVentaDesdeExito(): void {
    this.resetFormulario();
    this.step.set(0);
    this.ventaExitosa.set(false);
    this.ventaExitosaData.set(null);
  }

  // ── Agrupamiento lista ────────────────────────────────
  private agruparVentas(ventas: Sale[]): VentaAgrupada[] {
    const map = new Map<string, VentaAgrupada>();
    for (const v of ventas) {
      const key = `${v.saleDateTime}|${v.clientDocument}`;
      if (map.has(key)) {
        const g = map.get(key)!;
        g.ventas.push(v);
        g.grossTotal   += v.grossTotal;
        g.stylistTotal += v.stylistTotal;
        if (!g.stylistNames.includes(v.stylistName)) {
          g.stylistNames += `, ${v.stylistName}`;
        }
        const methods = new Set(g.paymentMethodName.split(' / '));
        if (v.paymentMethodName) methods.add(v.paymentMethodName);
        g.paymentMethodName = [...methods].join(' / ');
      } else {
        map.set(key, {
          id:               v.id,
          saleDateTime:     v.saleDateTime,
          clientName:       v.clientName,
          stylistNames:     v.stylistName,
          paymentMethodName: v.paymentMethodName ?? '',
          grossTotal:       v.grossTotal,
          stylistTotal:     v.stylistTotal,
          status:           v.status,
          ventas:           [v],
        });
      }
    }
    return Array.from(map.values());
  }

  // ── Helpers ───────────────────────────────────────────
  private resetFormulario(): void {
    this.formCliente.reset({ documentType: 'CC' });
    this.formVenta.reset({ tipAmount: 0 });
    this.grupos.set([{ stylist: null, items: [] }]);
    this.grupoActualIdx.set(0);
    this.tipAmountSig.set(0);
    this.tipGrupoIdx.set(0);
    this.pagos.set([{ paymentMethodId: null, amount: 0 }]);
    this.clienteEncontrado.set(null);
    this.filtroServicio.set('');
    this.categoriaServicio.set('Todos');
    this.filtroProductoVenta.set('');
    this.buscadorProducto.set('');
    this.ventaExitosa.set(false);
    this.ventaExitosaData.set(null);
    this.folioVenta.set('');
    // Mantener la fecha elegida para facilitar carga de múltiples ventas del mismo día
  }

  // Items del grupo activo (para pasos 2 y 3)
  itemsServicio()        { return this.grupoActual().items.filter(i => i.type === 'Service') as SaleServiceItem[]; }
  itemsProductoVenta()   { return this.grupoActual().items.filter(i => i.type === 'ProductSale') as SaleProductItem[]; }
  itemsProductoInterno() { return this.grupoActual().items.filter(i => i.type === 'ProductInternal') as SaleProductItem[]; }

  // Items de un grupo específico (para paso 5 confirmar)
  itemsServicioGrupo(idx: number)        { return this.grupos()[idx].items.filter(i => i.type === 'Service') as SaleServiceItem[]; }
  itemsProductoVentaGrupo(idx: number)   { return this.grupos()[idx].items.filter(i => i.type === 'ProductSale') as SaleProductItem[]; }
  itemsProductoInternoGrupo(idx: number) { return this.grupos()[idx].items.filter(i => i.type === 'ProductInternal') as SaleProductItem[]; }

  subtotalItem(item: SaleItem): number { return item.price * item.quantity; }

  itemStylistPct(item: SaleItem, commissionPercent: number): number {
    if (item.type === 'Service') return commissionPercent;
    if (item.type === 'ProductSale') return (item as SaleProductItem).stylistCommissionPercent;
    return 0;
  }

  itemStylistAmount(item: SaleItem, commissionPercent: number): number {
    const gross = item.price * item.quantity;
    return Math.round(gross * this.itemStylistPct(item, commissionPercent) / 100);
  }

  /** Cálculo financiero de un grupo específico para el paso de confirmar */
  calculoGrupoConfirmar(idx: number): SaleCalculation {
    return this.calcularParaGrupo(idx, this.totalACobrar(), this.deductionTotalAmount());
  }

  private calcularParaGrupo(idx: number, totalWithTip: number, dedTotal: number): SaleCalculation {
    const g        = this.grupos()[idx];
    const tipIdx    = this.tipGrupoIdx();
    const groupGross = g.items.filter(i => i.type !== 'ProductInternal')
      .reduce((s, i) => s + i.price * i.quantity, 0)
      + (idx === tipIdx ? this.tipAmountSig() : 0);
    const frac     = totalWithTip > 0 ? groupGross / totalWithTip : 0;
    const groupDed = Math.round(dedTotal * frac);
    return calculateSale({
      items:          g.items,
      tipAmount:      idx === tipIdx ? this.tipAmountSig() : 0,
      deductionAmount: groupDed,
      stylistCommPct: g.stylist?.commissionPercent ?? 0,
    });
  }

  servicioYaAgregado(id: number)        { return this.grupoActual().items.some(i => i.type === 'Service' && (i as SaleServiceItem).serviceId === id); }
  productoVentaYaAgregado(id: number)   { return this.grupoActual().items.some(i => i.type === 'ProductSale' && (i as SaleProductItem).productId === id); }
  productoInternoYaAgregado(id: number) { return this.grupoActual().items.some(i => i.type === 'ProductInternal' && (i as SaleProductItem).productId === id); }

  totalItemsCount(): number {
    return this.grupos().reduce((total, g) => total + g.items.filter(i => i.type !== 'ProductInternal').length, 0);
  }

  trackItem(_: number, item: SaleItem) {
    return item.type === 'Service' ? `S-${(item as SaleServiceItem).serviceId}` : `P-${item.type}-${(item as SaleProductItem).productId}`;
  }
  trackPago(index: number) { return index; }
  trackGrupo(index: number) { return index; }

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

  private hoy(): string { return todayColombia(); }

  get maxDate(): string { return this.hoy(); }
  get minDate(): string { return '2025-01-01'; }
}
