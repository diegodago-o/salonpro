import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { VentasService } from '../../core/services/ventas.service';
import { TicketService } from '../../core/services/ticket.service';
import { CajaService } from '../../core/services/caja.service';
import { BranchService } from '../../core/services/branch.service';
import { ClientesService } from '../../core/services/clientes.service';
import { environment } from '../../../environments/environment';
import { Cliente } from '../../core/models/clientes.models';
import {
  ClientOption, PaymentEntry, PaymentMethodOption, ProductOption,
  SaleCalculation, SaleItem, SaleProductItem, SaleServiceItem,
  ServiceOption, StylistOption
} from '../../core/models/ventas.models';
import { SaleGroup } from '../../core/models/ticket.models';
import { calculateSale } from '../../core/utils/sale-calculator';
import { todayColombia } from '../../core/utils/colombia-time';
import { IconComponent } from '../../shared/components/icon/icon.component';

type PasoGrupo = 'estilista' | 'servicios' | 'productos' | 'listo';

interface ReciboVenta {
  clientName: string;
  fecha: string;
  grupos: { stylistName: string; items: { name: string; price: number }[] }[];
  pagos: { methodName: string; amount: number }[];
  subtotal: number;
  tipAmount: number;
  total: number;
}


@Component({
  selector: 'app-ventas',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, DecimalPipe, IconComponent],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss'
})
export class VentasComponent implements OnInit {
  private readonly fb             = inject(FormBuilder);
  private readonly ventasService  = inject(VentasService);
  private readonly ticketService  = inject(TicketService);
  private readonly cajaService    = inject(CajaService);
  private readonly branchService  = inject(BranchService);
  private readonly clientesService = inject(ClientesService);
  private readonly http           = inject(HttpClient);

  readonly logoSalon = signal('');
  readonly guardando = signal(false);
  readonly errorMsg  = signal<string | null>(null);
  readonly Math      = Math;

  // ── Catálogos ──────────────────────────────────────────
  readonly servicios    = signal<ServiceOption[]>([]);
  readonly productos    = signal<ProductOption[]>([]);
  readonly peluqueros   = signal<StylistOption[]>([]);
  readonly metodosPago  = signal<PaymentMethodOption[]>([]);
  readonly cajaAbierta  = signal(false);
  readonly cargando     = signal(true);

  // ── Cliente ────────────────────────────────────────────
  readonly clientesDisponibles = signal<Cliente[]>([]);
  readonly busquedaCliente     = signal('');
  readonly mostrarSugerencias  = signal(false);
  readonly clienteSeleccionado = signal<ClientOption | null>(null);
  readonly formCliente = this.fb.group({
    documentType:   ['CC', Validators.required],
    documentNumber: ['', Validators.required],
    fullName:       ['', Validators.required],
    email:          [''],
    phone:          [''],
  });

  readonly clientesSugeridos = computed(() => {
    const q = this.busquedaCliente().toLowerCase().trim();
    if (q.length < 2) return [];
    return this.clientesDisponibles()
      .filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        c.documentNumber.includes(q) ||
        (c.phone && c.phone.includes(q))
      )
      .slice(0, 7);
  });

  // ── Carrito multi-estilista ────────────────────────────
  readonly grupos = signal<SaleGroup[]>([]);

  readonly grupoEditandoIdx = signal<number | null>(null);
  readonly pasoGrupo        = signal<PasoGrupo>('estilista');

  readonly estilistaTemp   = signal<StylistOption | null>(null);
  readonly serviciosTemp   = signal<SaleServiceItem[]>([]);
  readonly productosTemp   = signal<SaleProductItem[]>([]);

  readonly pickerServ  = signal<ServiceOption | null>(null);
  readonly precioServ  = signal(0);
  readonly pickerProd  = signal<ProductOption | null>(null);
  readonly precioProd  = signal(0);
  readonly tipoProd    = signal<'venta' | 'interno'>('venta');
  readonly filtroProd      = signal<'venta' | 'interno'>('venta');
  readonly filtroServ      = signal('');
  readonly filtroNombreProd = signal('');

  // ── Pago ──────────────────────────────────────────────
  readonly tipAmount      = signal(0);
  readonly tipStylistIdx  = signal<number>(0);  // Fix 1: índice del grupo que recibe la propina
  readonly pagos          = signal<PaymentEntry[]>([{ paymentMethodId: null, amount: 0 }]);
  readonly notas          = signal('');

  // Fix 2: detectar si algún método seleccionado es efectivo
  readonly tieneEfectivo = computed(() =>
    this.pagos().some(p => {
      const method = this.metodosPago().find(m => m.id === p.paymentMethodId);
      return method?.name?.toLowerCase().includes('efectivo') ?? false;
    })
  );

  readonly totalGrupos = computed(() =>
    this.grupos().reduce((s, g) =>
      s + g.items.reduce((si, item) => si + item.price * item.quantity, 0), 0)
  );
  readonly totalConPropina = computed(() =>
    this.totalGrupos() + (this.tieneEfectivo() ? 0 : this.tipAmount())
  );

  readonly totalPagado = computed(() =>
    this.pagos().reduce((s, p) => s + (p.amount || 0), 0)
  );
  readonly diferencia = computed(() => this.totalConPropina() - this.totalPagado());

  readonly puedeRegistrar = computed(() =>
    this.grupos().length > 0 &&
    this.grupos().every(g => g.stylist !== null && g.items.length > 0) &&
    Math.abs(this.diferencia()) < 1 &&
    !this.guardando()
  );

  // ── Recibo y éxito ────────────────────────────────────
  readonly ventaExitosa = signal(false);
  readonly ventaRecibo  = signal<ReciboVenta | null>(null);  // Fix 3

  // ── Servicios filtrados ────────────────────────────────
  readonly serviciosFiltrados = computed(() => {
    const q = this.filtroServ().toLowerCase().trim();
    if (!q) return this.servicios();
    return this.servicios().filter(s =>
      s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
  });
  readonly productosFiltrados = computed(() => {
    const t = this.filtroProd();
    const q = this.filtroNombreProd().toLowerCase().trim();
    return this.productos().filter(p => {
      if (t === 'venta' ? !p.isForSale : p.isForSale) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q);
    });
  });

  constructor() {
    toObservable(this.branchService.selectedBranch)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargarCatalogos());
  }

  ngOnInit(): void {
    this.clientesService.getClientes()
      .subscribe(r => this.clientesDisponibles.set(r.data ?? []));
    if (environment.production) {
      this.http.get<{ logoUrl?: string }>('/api/v1/tenant-profile')
        .subscribe({ next: r => this.logoSalon.set(r.logoUrl ?? ''), error: () => {} });
    }
  }

  readonly errorCatalogos = signal<string | null>(null);

  recargarCatalogos(): void { this.cargarCatalogos(); }

  private cargarCatalogos(): void {
    this.cargando.set(true);
    this.errorCatalogos.set(null);
    const bid = this.branchService.currentBranchId;
    this.ventasService.getServicios(bid).subscribe({
      next: r => this.servicios.set(r.data ?? []),
      error: () => this.errorCatalogos.set('No se pudieron cargar los servicios. Recarga la página.'),
    });
    this.ventasService.getProductos(bid).subscribe({
      next: r => this.productos.set(r.data ?? []),
      error: () => this.errorCatalogos.set('No se pudieron cargar los productos. Recarga la página.'),
    });
    this.ventasService.getPeluqueros(bid).subscribe({
      next: r => this.peluqueros.set(r.data ?? []),
      error: () => this.errorCatalogos.set('No se pudieron cargar los colaboradores. Recarga la página.'),
    });
    this.ventasService.getMetodosPago().subscribe({
      next: r => { this.metodosPago.set(r.data ?? []); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.errorCatalogos.set('Error al cargar métodos de pago. Recarga la página.'); },
    });
    this.cajaService.getCajaActual(bid).subscribe({
      next: r => this.cajaAbierta.set(r.data?.status === 'Open'),
      error: () => {},
    });
  }

  // ── Navegación ────────────────────────────────────────
  abrirNuevaVenta(): void {
    this.grupos.set([]);
    this.clienteSeleccionado.set(null);
    this.busquedaCliente.set('');
    this.formCliente.reset({ documentType: 'CC', documentNumber: '', fullName: '', email: '', phone: '' });
    this.tipAmount.set(0);
    this.tipStylistIdx.set(0);
    this.pagos.set([{ paymentMethodId: null, amount: 0 }]);
    this.notas.set('');
    this.errorMsg.set(null);
    this.ventaExitosa.set(false);
    this.ventaRecibo.set(null);
    this.grupoEditandoIdx.set(null);
    this.agregarGrupo();
  }

  // ── Cliente ────────────────────────────────────────────
  seleccionarClienteSugerido(c: Cliente): void {
    this.clienteSeleccionado.set({
      id: c.id, documentType: c.documentType, documentNumber: c.documentNumber,
      fullName: c.fullName, email: c.email ?? '', phone: c.phone ?? ''
    });
    this.formCliente.patchValue({
      documentType: c.documentType, documentNumber: c.documentNumber,
      fullName: c.fullName, email: c.email ?? '', phone: c.phone ?? ''
    });
    this.busquedaCliente.set(c.fullName);
    this.mostrarSugerencias.set(false);
  }

  onBusquedaClienteInput(val: string): void {
    this.busquedaCliente.set(val);
    this.mostrarSugerencias.set(val.length >= 2);
    if (!val) { this.clienteSeleccionado.set(null); this.formCliente.reset({ documentType: 'CC' }); }
  }

  cambiarCliente(): void {
    this.clienteSeleccionado.set(null);
    this.busquedaCliente.set('');
    this.formCliente.reset({ documentType: 'CC', documentNumber: '', fullName: '', email: '', phone: '' });
  }

  // ── Grupos ────────────────────────────────────────────
  agregarGrupo(): void {
    const nuevo: SaleGroup = { stylist: null, items: [], abierto: true };
    const idx = this.grupos().length;
    this.grupos.update(gs => [...gs, nuevo]);
    this.abrirEditorGrupo(idx);
  }

  abrirEditorGrupo(idx: number): void {
    const g = this.grupos()[idx];
    this.estilistaTemp.set(g.stylist);
    this.serviciosTemp.set(g.items.filter(i => i.type === 'Service') as SaleServiceItem[]);
    this.productosTemp.set(g.items.filter(i => i.type !== 'Service') as SaleProductItem[]);
    this.grupoEditandoIdx.set(idx);
    this.pasoGrupo.set(g.stylist ? 'servicios' : 'estilista');
    this.pickerServ.set(null);
    this.pickerProd.set(null);
    this.filtroServ.set('');
    this.filtroNombreProd.set('');
  }

  cerrarEditorGrupo(): void {
    const idx = this.grupoEditandoIdx();
    if (idx === null) return;
    const stylist = this.estilistaTemp();
    const items: SaleItem[] = [
      ...this.serviciosTemp(),
      ...this.productosTemp(),
    ];
    if (!stylist && items.length === 0) {
      this.grupos.update(gs => gs.filter((_, i) => i !== idx));
    } else {
      this.grupos.update(gs => gs.map((g, i) =>
        i === idx ? { ...g, stylist, items, abierto: false } : g
      ));
    }
    this.grupoEditandoIdx.set(null);
  }

  eliminarGrupo(idx: number): void {
    if (this.grupoEditandoIdx() === idx) this.grupoEditandoIdx.set(null);
    this.grupos.update(gs => gs.filter((_, i) => i !== idx));
    if (this.tipStylistIdx() >= this.grupos().length) {
      this.tipStylistIdx.set(0);
    }
  }

  seleccionarEstilista(s: StylistOption): void {
    const idx = this.grupoEditandoIdx()!;
    const yaExiste = this.grupos().findIndex((g, i) => i !== idx && g.stylist?.id === s.id);
    if (yaExiste >= 0) {
      const itemsTemp: SaleItem[] = [...this.serviciosTemp(), ...this.productosTemp()];
      this.grupos.update(gs => gs.map((g, i) => {
        if (i === yaExiste) return { ...g, items: [...g.items, ...itemsTemp] };
        return g;
      }));
      this.grupos.update(gs => gs.filter((_, i) => i !== idx));
      this.grupoEditandoIdx.set(null);
      return;
    }
    this.estilistaTemp.set(s);
    this.pasoGrupo.set('servicios');
  }

  // ── Desglose financiero ───────────────────────────────
  readonly desglose = computed(() => {
    const totalBruto  = this.totalConPropina();
    const tipIdx      = this.tipStylistIdx();
    const deduccionTotal = totalBruto > 0
      ? this.pagos()
          .filter(p => p.paymentMethodId && p.amount > 0)
          .reduce((s, p) => {
            const method = this.metodosPago().find(m => m.id === p.paymentMethodId);
            return s + (method?.hasDeduction ? Math.round(p.amount * method.deductionPercent / 100) : 0);
          }, 0)
      : 0;

    const grupos = this.grupos().map((g, idx) => {
      if (!g.stylist || g.items.length === 0) return null;
      const getsTip     = idx === tipIdx && !this.tieneEfectivo();  // Fix 1 + Fix 2
      const tipForGroup = getsTip ? this.tipAmount() : 0;
      const calc = calculateSale({
        items: g.items,
        tipAmount: tipForGroup,
        deductionAmount: totalBruto > 0
          ? Math.round(deduccionTotal * (g.items.reduce((s, i) => s + i.price, 0) + tipForGroup) / totalBruto)
          : 0,
        stylistCommPct: g.stylist.commissionPercent,
      });
      return { stylist: g.stylist, calc };
    }).filter((x): x is { stylist: StylistOption; calc: SaleCalculation } => x !== null);

    return {
      grupos,
      deduccionTotal,
      totalSalon:       grupos.reduce((s, g) => s + g.calc.salonTotal, 0),
      totalColaborador: grupos.reduce((s, g) => s + g.calc.stylistTotal, 0),
    };
  });

  // Servicios del grupo
  quickAgregarServicio(svc: ServiceOption): void {
    const nuevo: SaleServiceItem = {
      type: 'Service', serviceId: svc.id, name: svc.name,
      price: svc.price, quantity: 1,
      hasSalonFee: svc.hasSalonFee, salonFeePercent: svc.salonFeePercent
    };
    this.serviciosTemp.update(s => [...s, nuevo]);
  }

  agregarServicioConPrecio(): void {
    const svc = this.pickerServ();
    if (!svc) return;
    const precio = this.precioServ() > 0 ? this.precioServ() : svc.price;
    const nuevo: SaleServiceItem = {
      type: 'Service', serviceId: svc.id, name: svc.name,
      price: precio, quantity: 1,
      hasSalonFee: svc.hasSalonFee, salonFeePercent: svc.salonFeePercent
    };
    this.serviciosTemp.update(s => [...s, nuevo]);
    this.pickerServ.set(null);
    this.precioServ.set(0);
  }

  abrirPrecioPersonalizado(svc: ServiceOption): void {
    this.pickerServ.set(svc);
    this.precioServ.set(svc.price);
  }

  quitarServicio(i: number): void {
    this.serviciosTemp.update(s => s.filter((_, idx) => idx !== i));
  }

  // Productos del grupo
  quickAgregarProducto(prod: ProductOption, tipo: 'venta' | 'interno'): void {
    const precio = tipo === 'venta' ? prod.salePrice : prod.purchasePrice;
    const nuevo: SaleProductItem = {
      type: tipo === 'venta' ? 'ProductSale' : 'ProductInternal',
      productId: prod.id, name: prod.name,
      price: precio, quantity: 1,
      stylistCommissionPercent: prod.stylistCommissionPercent
    };
    this.productosTemp.update(p => [...p, nuevo]);
  }

  agregarProductoConPrecio(): void {
    const prod = this.pickerProd();
    if (!prod) return;
    const precio = this.tipoProd() === 'venta'
      ? (this.precioProd() > 0 ? this.precioProd() : prod.salePrice)
      : prod.purchasePrice;
    const tipo = this.tipoProd() === 'venta' ? 'ProductSale' : 'ProductInternal';
    const nuevo: SaleProductItem = {
      type: tipo, productId: prod.id, name: prod.name,
      price: precio, quantity: 1,
      stylistCommissionPercent: prod.stylistCommissionPercent
    };
    this.productosTemp.update(p => [...p, nuevo]);
    this.pickerProd.set(null);
    this.precioProd.set(0);
  }

  abrirPrecioProd(prod: ProductOption): void {
    this.pickerProd.set(prod);
    this.precioProd.set(prod.salePrice);
  }

  quitarProducto(i: number): void {
    this.productosTemp.update(p => p.filter((_, idx) => idx !== i));
  }

  // ── Pago ──────────────────────────────────────────────
  setMetodoPago(idx: number, id: number): void {
    this.pagos.update(ps => ps.map((p, i) => i === idx ? { ...p, paymentMethodId: +id } : p));
    if (this.tieneEfectivo()) {   // Fix 2: resetear propina si pago cambia a efectivo
      this.tipAmount.set(0);
    }
    this.syncPagoUnico();
  }

  setMontoPago(idx: number, val: number): void {
    this.pagos.update(ps => ps.map((p, i) => i === idx ? { ...p, amount: val } : p));
  }

  agregarPago(): void {
    this.pagos.update(ps => [...ps, { paymentMethodId: null, amount: 0 }]);
  }

  quitarPago(idx: number): void {
    if (this.pagos().length <= 1) return;
    this.pagos.update(ps => ps.filter((_, i) => i !== idx));
  }

  private syncPagoUnico(): void {
    if (this.pagos().length === 1) {
      this.pagos.update(ps => [{ ...ps[0], amount: this.totalConPropina() }]);
    }
  }

  onTipChange(val: number): void {
    if (this.tieneEfectivo()) return;   // Fix 2: ignorar si pago es efectivo
    this.tipAmount.set(val || 0);
    this.syncPagoUnico();
  }

  // ── Registrar ─────────────────────────────────────────
  registrarVenta(): void {
    if (!this.puedeRegistrar()) return;
    this.errorMsg.set(null);
    this.guardando.set(true);

    const fc     = this.formCliente.value;
    const branch = this.branchService.selectedBranch();
    const docType   = fc.documentType || 'CC';
    const docNumber = fc.documentNumber || 'SIN_DOCUMENTO';
    const fullName  = fc.fullName || 'Consumidor Final';
    const tipAmt    = this.tieneEfectivo() ? 0 : this.tipAmount();

    // Fix 3: capturar datos del recibo antes de enviar
    const recibo: ReciboVenta = {
      clientName: fullName,
      fecha: new Date().toISOString(),
      grupos: this.grupos().map(g => ({
        stylistName: g.stylist!.fullName,
        items: g.items.map(i => ({ name: i.name, price: i.price })),
      })),
      pagos: this.pagos()
        .filter(p => p.paymentMethodId && p.amount > 0)
        .map(p => ({
          methodName: this.metodosPago().find(m => m.id === p.paymentMethodId)?.name ?? '',
          amount: p.amount,
        })),
      subtotal: this.totalGrupos(),
      tipAmount: tipAmt,
      total: this.totalGrupos() + tipAmt,
    };

    const request = {
      clientDocumentType:   docType,
      clientDocumentNumber: docNumber,
      clientFullName:       fullName,
      clientEmail:          fc.email || undefined,
      clientPhone:          fc.phone || undefined,
      branchId:   branch?.id,
      branchName: branch?.name,
      payments:   this.pagos()
        .filter(p => p.paymentMethodId && p.amount > 0)
        .map(p => ({ paymentMethodId: p.paymentMethodId!, amount: p.amount })),
      tipAmount:     tipAmt,
      tipGroupIndex: this.tipStylistIdx(),   // Fix 1
      notes:     this.notas() || undefined,
      groups:    this.grupos().map(g => ({
        stylistId:         g.stylist!.id,
        stylistName:       g.stylist!.fullName,
        commissionPercent: g.stylist!.commissionPercent,
        services: g.items
          .filter(i => i.type === 'Service')
          .map(i => ({ serviceId: (i as SaleServiceItem).serviceId, price: i.price })),
        productsSold: g.items
          .filter(i => i.type === 'ProductSale')
          .map(i => ({ productId: (i as SaleProductItem).productId, price: i.price })),
        productsInternal: g.items
          .filter(i => i.type === 'ProductInternal')
          .map(i => ({ productId: (i as SaleProductItem).productId, price: i.price })),
      })),
    };

    this.ticketService.crearTicket(request).subscribe({
      next: () => {
        this.guardando.set(false);
        this.ventaRecibo.set(recibo);   // Fix 3
        this.ventaExitosa.set(true);
      },
      error: (e) => {
        const msg = e?.error?.message || e?.error?.errors?.[0] || 'Error al registrar la venta.';
        this.errorMsg.set(msg);
        this.guardando.set(false);
      }
    });
  }

  nuevaVentaTrasSalida(): void {
    this.abrirNuevaVenta();
  }

  // ── Cálculo de participación ──────────────────────────
  grupoSubtotal(g: SaleGroup): number {
    return g.items.reduce((s, i) => s + i.price * i.quantity, 0);
  }

  grupoParticipacion(g: SaleGroup): number {
    if (!g.stylist) return 0;
    const items = g.items;
    const grossServices = items.filter(i => i.type === 'Service').reduce((s, i) => s + i.price, 0);
    const grossProducts = items.filter(i => i.type === 'ProductSale').reduce((s, i) => s + i.price, 0);
    const pct = g.stylist.commissionPercent / 100;
    return Math.round((grossServices + grossProducts) * pct);
  }

  tieneItemsEnGrupo(idx: number): boolean {
    return (this.grupos()[idx]?.items.length ?? 0) > 0;
  }

  itemsGrupo(g: SaleGroup): SaleItem[] { return g.items; }
}
