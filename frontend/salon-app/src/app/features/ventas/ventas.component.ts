import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
  ServiceOption, StylistOption, Sale
} from '../../core/models/ventas.models';
import { SaleGroup } from '../../core/models/ticket.models';
import { calculateSale } from '../../core/utils/sale-calculator';
import { colombiaEndOfDay, colombiaStartOfDay, todayColombia } from '../../core/utils/colombia-time';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Vista = 'lista' | 'nueva-venta' | 'anular';
type PasoGrupo = 'estilista' | 'servicios' | 'productos' | 'listo';

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
  readonly vista     = signal<Vista>('lista');
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

  // ── Lista de ventas (consulta) ─────────────────────────
  readonly ventas       = signal<Sale[]>([]);
  readonly ventaAnular  = signal<Sale | null>(null);
  readonly ventaDetalle = signal<Sale | null>(null);
  readonly fechaDesde   = signal(colombiaStartOfDay(todayColombia()));
  readonly fechaHasta   = signal(colombiaEndOfDay(todayColombia()));
  readonly cargandoVentas = signal(false);

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

  // Índice del grupo que está editándose ahora
  readonly grupoEditandoIdx = signal<number | null>(null);
  readonly pasoGrupo        = signal<PasoGrupo>('estilista');

  // Selecciones temporales para el grupo activo
  readonly estilistaTemp   = signal<StylistOption | null>(null);
  readonly serviciosTemp   = signal<SaleServiceItem[]>([]);
  readonly productosTemp   = signal<SaleProductItem[]>([]);

  // Selección de servicio/producto en el picker
  readonly pickerServ  = signal<ServiceOption | null>(null);
  readonly precioServ  = signal(0);
  readonly pickerProd  = signal<ProductOption | null>(null);
  readonly precioProd  = signal(0);
  readonly tipoProd    = signal<'venta' | 'interno'>('venta');
  readonly filtroProd  = signal<'venta' | 'interno'>('venta');
  readonly filtroServ  = signal('');

  // ── Pago ──────────────────────────────────────────────
  readonly tipAmount   = signal(0);
  readonly pagos       = signal<PaymentEntry[]>([{ paymentMethodId: null, amount: 0 }]);
  readonly notas       = signal('');

  readonly totalGrupos = computed(() =>
    this.grupos().reduce((s, g) =>
      s + g.items.reduce((si, item) => si + item.price * item.quantity, 0), 0)
  );
  readonly totalConPropina = computed(() => this.totalGrupos() + this.tipAmount());

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

  // ── Resumen éxito ──────────────────────────────────────
  readonly ventaExitosa = signal(false);

  // ── Servicios filtrados ────────────────────────────────
  readonly serviciosFiltrados = computed(() => {
    const q = this.filtroServ().toLowerCase().trim();
    if (!q) return this.servicios();
    return this.servicios().filter(s =>
      s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
  });
  readonly productosFiltrados = computed(() => {
    const t = this.filtroProd();
    return this.productos().filter(p => t === 'venta' ? p.isForSale : !p.isForSale);
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

  private cargarCatalogos(): void {
    this.cargando.set(true);
    const bid = this.branchService.currentBranchId;
    this.ventasService.getServicios(bid).subscribe(r => this.servicios.set(r.data ?? []));
    this.ventasService.getProductos(bid).subscribe(r => this.productos.set(r.data ?? []));
    this.ventasService.getPeluqueros(bid).subscribe(r => this.peluqueros.set(r.data ?? []));
    this.ventasService.getMetodosPago().subscribe(r => {
      this.metodosPago.set(r.data ?? []);
      this.cargando.set(false);
    });
    this.cajaService.getCajaActual(bid).subscribe(r => this.cajaAbierta.set(r.data?.status === 'Open'));
    this.cargarVentas();
  }

  cargarVentas(): void {
    this.cargandoVentas.set(true);
    const bid = this.branchService.currentBranchId;
    const bname = this.branchService.selectedBranch()?.name;
    this.ventasService.getVentas(
      this.fechaDesde(), this.fechaHasta(), bid, bname
    ).subscribe({
      next: r => { this.ventas.set(r.data ?? []); this.cargandoVentas.set(false); },
      error: () => this.cargandoVentas.set(false)
    });
  }

  // ── Navegación ────────────────────────────────────────
  abrirNuevaVenta(): void {
    this.grupos.set([]);
    this.clienteSeleccionado.set(null);
    this.busquedaCliente.set('');
    this.formCliente.reset({ documentType: 'CC', documentNumber: '', fullName: '', email: '', phone: '' });
    this.tipAmount.set(0);
    this.pagos.set([{ paymentMethodId: null, amount: 0 }]);
    this.notas.set('');
    this.errorMsg.set(null);
    this.ventaExitosa.set(false);
    this.grupoEditandoIdx.set(null);
    this.vista.set('nueva-venta');
    this.agregarGrupo();
  }

  volverALista(): void {
    this.vista.set('lista');
    this.cargarVentas();
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
  }

  seleccionarEstilista(s: StylistOption): void {
    // Verificar que no esté ya en otro grupo (fusionar si repite)
    const idx = this.grupoEditandoIdx()!;
    const yaExiste = this.grupos().findIndex((g, i) => i !== idx && g.stylist?.id === s.id);
    if (yaExiste >= 0) {
      // Fusionar: mover todo al grupo existente
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

  // ── Desglose financiero (pre-factura interna) ─────────
  readonly desglose = computed(() => {
    const totalPagado = this.totalPagado();
    const totalBruto  = this.totalConPropina();
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
      const isFirst = idx === 0;
      const calc = calculateSale({
        items: g.items,
        tipAmount: isFirst ? this.tipAmount() : 0,
        deductionAmount: totalBruto > 0
          ? Math.round(deduccionTotal * (g.items.reduce((s, i) => s + i.price, 0) + (isFirst ? this.tipAmount() : 0)) / totalBruto)
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
    this.tipAmount.set(val || 0);
    this.syncPagoUnico();
  }

  // ── Registrar ─────────────────────────────────────────
  registrarVenta(): void {
    if (!this.puedeRegistrar()) return;
    this.errorMsg.set(null);
    this.guardando.set(true);

    const fc    = this.formCliente.value;
    const branch = this.branchService.selectedBranch();
    const docType   = fc.documentType || 'CC';
    const docNumber = fc.documentNumber || 'SIN_DOCUMENTO';
    const fullName  = fc.fullName || 'Consumidor Final';

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
      tipAmount: this.tipAmount(),
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

  // ── Anular ────────────────────────────────────────────
  abrirAnular(v: Sale): void { this.ventaAnular.set(v); this.vista.set('anular'); }
  cancelarAnular(): void    { this.ventaAnular.set(null); this.vista.set('lista'); }

  readonly formAnular = this.fb.group({ reason: ['', Validators.required] });

  confirmarAnular(): void {
    if (this.formAnular.invalid) return;
    const v = this.ventaAnular();
    if (!v) return;
    this.guardando.set(true);
    this.ventasService.anularVenta(v.id, this.formAnular.value.reason!).subscribe({
      next: () => { this.guardando.set(false); this.cancelarAnular(); },
      error: () => { this.guardando.set(false); }
    });
  }

  // ── Detalle de venta ──────────────────────────────────
  abrirDetalle(v: Sale): void {
    this.ventasService.getSaleDetail(v.id).subscribe(r => this.ventaDetalle.set(r.data));
  }
  cerrarDetalle(): void { this.ventaDetalle.set(null); }

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

  // Utilidades de vista
  tieneItemsEnGrupo(idx: number): boolean {
    return (this.grupos()[idx]?.items.length ?? 0) > 0;
  }

  itemsGrupo(g: SaleGroup): SaleItem[] { return g.items; }
}
