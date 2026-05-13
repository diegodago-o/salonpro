import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../models/auth.models';
import { CashRegister, CloseCajaRequest, OpenCajaRequest } from '../models/caja.models';
import { environment } from '../../../environments/environment';

const MOCK_HISTORIAL: CashRegister[] = [
  {
    id: 1, branchId: 1, branchName: 'Sede Principal',
    cashierId: 1, cashierName: 'Admin Demo',
    openedAt: '2026-05-07T08:00:00', closedAt: '2026-05-07T19:30:00',
    openingBalance: 200000, declaredCash: 648500, expectedCash: 650000,
    difference: -1500, status: 'Closed', notes: null,
    details: [
      { paymentMethodId: 1, paymentMethodName: 'Efectivo', totalAmount: 450000, totalDeductions: 0, netAmount: 450000 },
      { paymentMethodId: 2, paymentMethodName: 'Tarjeta crédito', totalAmount: 320000, totalDeductions: 22400, netAmount: 297600 },
      { paymentMethodId: 3, paymentMethodName: 'Nequi', totalAmount: 180000, totalDeductions: 0, netAmount: 180000 },
    ]
  },
  {
    id: 2, branchId: 1, branchName: 'Sede Principal',
    cashierId: 1, cashierName: 'Admin Demo',
    openedAt: '2026-05-06T08:00:00', closedAt: '2026-05-06T18:00:00',
    openingBalance: 200000, declaredCash: 412000, expectedCash: 412000,
    difference: 0, status: 'Closed', notes: null,
    details: [
      { paymentMethodId: 1, paymentMethodName: 'Efectivo', totalAmount: 212000, totalDeductions: 0, netAmount: 212000 },
      { paymentMethodId: 2, paymentMethodName: 'Tarjeta crédito', totalAmount: 150000, totalDeductions: 10500, netAmount: 139500 },
    ]
  }
];

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/cash-registers`;

  private mockCajaAbierta: CashRegister | null = null;

  getCajaActual(branchId?: number | null): Observable<ApiResponse<CashRegister | null>> {
    if (!environment.production) {
      return of({ success: true, data: this.mockCajaAbierta, message: '', errors: [] });
    }
    const params = branchId ? `?branchId=${branchId}` : '';
    return this.http.get<ApiResponse<CashRegister | null>>(`${this.api}/current${params}`);
  }

  getHistorial(branchId?: number | null): Observable<ApiResponse<CashRegister[]>> {
    if (!environment.production) {
      return of({ success: true, data: MOCK_HISTORIAL, message: '', errors: [] });
    }
    const params = branchId ? `?branchId=${branchId}` : '';
    return this.http.get<ApiResponse<CashRegister[]>>(`${this.api}${params}`);
  }

  getDetalle(id: number): Observable<ApiResponse<CashRegister>> {
    if (!environment.production) {
      const caja = MOCK_HISTORIAL.find(c => c.id === id)!;
      return of({ success: true, data: caja, message: '', errors: [] });
    }
    return this.http.get<ApiResponse<CashRegister>>(`${this.api}/${id}`);
  }

  abrirCaja(request: OpenCajaRequest): Observable<ApiResponse<CashRegister>> {
    if (!environment.production) {
      const nueva: CashRegister = {
        id: 99, branchId: 1, branchName: 'Sede Principal',
        cashierId: 1, cashierName: 'Admin Demo',
        openedAt: new Date().toISOString(), closedAt: null,
        openingBalance: request.openingBalance,
        declaredCash: null, expectedCash: null, difference: null,
        status: 'Open', notes: request.notes ?? null, details: []
      };
      this.mockCajaAbierta = nueva;
      return of({ success: true, data: nueva, message: 'Caja abierta', errors: [] });
    }
    return this.http.post<ApiResponse<CashRegister>>(`${this.api}/open`, request);
  }

  cerrarCaja(id: number, request: CloseCajaRequest): Observable<ApiResponse<CashRegister>> {
    if (!environment.production) {
      const expectedCash = (this.mockCajaAbierta?.openingBalance ?? 0) + 450000;
      const closed: CashRegister = {
        ...this.mockCajaAbierta!,
        closedAt: new Date().toISOString(),
        declaredCash: request.declaredCash,
        expectedCash,
        difference: request.declaredCash - expectedCash,
        status: 'Closed',
        notes: request.notes ?? null,
        details: [
          { paymentMethodId: 1, paymentMethodName: 'Efectivo', totalAmount: 450000, totalDeductions: 0, netAmount: 450000 },
        ]
      };
      this.mockCajaAbierta = null;
      MOCK_HISTORIAL.unshift(closed);
      return of({ success: true, data: closed, message: 'Caja cerrada', errors: [] });
    }
    return this.http.post<ApiResponse<CashRegister>>(`${this.api}/${id}/close`, request);
  }
}
