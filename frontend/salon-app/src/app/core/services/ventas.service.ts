import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';
import {
  ClientOption, CreateSaleRequest, PaymentMethodOption,
  ProductOption, Sale, ServiceOption, StylistOption
} from '../models/ventas.models';

// ── Mock data ─────────────────────────────────────────────
const MOCK_SERVICES: ServiceOption[] = [
  { id: 1, name: 'Corte dama', category: 'Corte', price: 35000, hasSalonFee: false, salonFeePercent: 0 },
  { id: 2, name: 'Corte hombre', category: 'Corte', price: 25000, hasSalonFee: false, salonFeePercent: 0 },
  { id: 3, name: 'Tintura completa', category: 'Tintura', price: 80000, hasSalonFee: true, salonFeePercent: 4.5 },
  { id: 4, name: 'Manicure', category: 'Manos', price: 30000, hasSalonFee: false, salonFeePercent: 0 },
  { id: 5, name: 'Pedicure', category: 'Pies', price: 35000, hasSalonFee: false, salonFeePercent: 0 },
  { id: 6, name: 'Barba', category: 'Barba', price: 20000, hasSalonFee: false, salonFeePercent: 0 },
  { id: 7, name: 'Alisado', category: 'Tratamiento', price: 120000, hasSalonFee: true, salonFeePercent: 4.5 },
];

const MOCK_PRODUCTS: ProductOption[] = [
  { id: 1, name: 'Shampoo Loreal', brand: 'Loreal', category: 'Cabello', purchasePrice: 18000, salePrice: 32000, stock: 15, isForSale: true },
  { id: 2, name: 'Tinte Igora Royal', brand: 'Schwarzkopf', category: 'Tintura', purchasePrice: 12000, salePrice: 0, stock: 20, isForSale: false },
  { id: 3, name: 'Oxidante 20vol', brand: 'Schwarzkopf', category: 'Tintura', purchasePrice: 8000, salePrice: 0, stock: 30, isForSale: false },
  { id: 4, name: 'Mascarilla Keratina', brand: 'Loreal', category: 'Tratamiento', purchasePrice: 22000, salePrice: 45000, stock: 8, isForSale: true },
];

const MOCK_STYLISTS: StylistOption[] = [
  { id: 1, fullName: 'Carlos Restrepo', commissionPercent: 50 },
  { id: 2, fullName: 'María López', commissionPercent: 45 },
  { id: 3, fullName: 'Andrés Gómez', commissionPercent: 40 },
];

const MOCK_PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 1, name: 'Efectivo', hasDeduction: false, deductionPercent: 0 },
  { id: 2, name: 'Tarjeta crédito', hasDeduction: true, deductionPercent: 7 },
  { id: 3, name: 'Nequi', hasDeduction: false, deductionPercent: 0 },
  { id: 4, name: 'Daviplata', hasDeduction: false, deductionPercent: 0 },
  { id: 5, name: 'Transferencia', hasDeduction: false, deductionPercent: 0 },
];

const MOCK_SALES: Sale[] = [
  {
    id: 1, saleDateTime: new Date().toISOString(),
    stylistName: 'Carlos Restrepo', clientName: 'Ana López',
    clientDocument: '1234567890', paymentMethodName: 'Tarjeta crédito',
    grossTotal: 157000, totalDeductions: 10990, stylistTotal: 65751, salonTotal: 80259,
    tipAmount: 10000, status: 'Active'
  }
];

@Injectable({ providedIn: 'root' })
export class VentasService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}`;
  private mockSales = [...MOCK_SALES];

  getServicios(): Observable<ApiResponse<ServiceOption[]>> {
    if (!environment.production)
      return of({ success: true, data: MOCK_SERVICES, message: '', errors: [] });
    return this.http.get<ApiResponse<ServiceOption[]>>(`${this.api}/services`);
  }

  getProductos(): Observable<ApiResponse<ProductOption[]>> {
    if (!environment.production)
      return of({ success: true, data: MOCK_PRODUCTS, message: '', errors: [] });
    return this.http.get<ApiResponse<ProductOption[]>>(`${this.api}/products`);
  }

  getPeluqueros(): Observable<ApiResponse<StylistOption[]>> {
    if (!environment.production)
      return of({ success: true, data: MOCK_STYLISTS, message: '', errors: [] });
    return this.http.get<ApiResponse<StylistOption[]>>(`${this.api}/users?role=Stylist`);
  }

  getMetodosPago(): Observable<ApiResponse<PaymentMethodOption[]>> {
    if (!environment.production)
      return of({ success: true, data: MOCK_PAYMENT_METHODS, message: '', errors: [] });
    return this.http.get<ApiResponse<PaymentMethodOption[]>>(`${this.api}/payment-methods`);
  }

  buscarCliente(documentNumber: string): Observable<ApiResponse<ClientOption | null>> {
    if (!environment.production) {
      const mock: ClientOption | null = documentNumber === '1234567890'
        ? { id: 1, documentType: 'CC', documentNumber: '1234567890', fullName: 'Ana López', email: 'ana@email.com', phone: '3001234567' }
        : null;
      return of({ success: true, data: mock, message: '', errors: [] });
    }
    return this.http.get<ApiResponse<ClientOption | null>>(`${this.api}/clients/search?document=${documentNumber}`);
  }

  getVentasHoy(): Observable<ApiResponse<Sale[]>> {
    if (!environment.production)
      return of({ success: true, data: this.mockSales, message: '', errors: [] });
    return this.http.get<ApiResponse<Sale[]>>(`${this.api}/sales`);
  }

  crearVenta(request: CreateSaleRequest): Observable<ApiResponse<Sale>> {
    if (!environment.production) {
      const nueva: Sale = {
        id: this.mockSales.length + 1,
        saleDateTime: new Date().toISOString(),
        stylistName: MOCK_STYLISTS.find(s => s.id === request.stylistId)?.fullName ?? '',
        clientName: request.clientFullName,
        clientDocument: request.clientDocumentNumber,
        paymentMethodName: request.payments?.length ? MOCK_PAYMENT_METHODS.find(p => p.id === request.payments[0].paymentMethodId)?.name ?? '' : '',
        grossTotal: 0, totalDeductions: 0, stylistTotal: 0, salonTotal: 0,
        tipAmount: request.tipAmount, status: 'Active'
      };
      this.mockSales.unshift(nueva);
      return of({ success: true, data: nueva, message: 'Venta registrada', errors: [] });
    }
    return this.http.post<ApiResponse<Sale>>(`${this.api}/sales`, request);
  }

  anularVenta(id: number, reason: string): Observable<ApiResponse<void>> {
    if (!environment.production) {
      const sale = this.mockSales.find(s => s.id === id);
      if (sale) { sale.status = 'Voided'; sale.voidedReason = reason; }
      return of({ success: true, data: undefined, message: 'Venta anulada', errors: [] });
    }
    return this.http.patch<ApiResponse<void>>(`${this.api}/sales/${id}/void`, { reason });
  }
}
