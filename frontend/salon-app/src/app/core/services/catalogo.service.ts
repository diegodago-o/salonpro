import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';
import { CreateProductoRequest, CreateServicioRequest, Producto, Servicio } from '../models/catalogo.models';

const MOCK_SERVICIOS: Servicio[] = [
  { id: 1, name: 'Corte dama', category: 'Corte', price: 35000, hasSalonFee: false, salonFeePercent: 0, isActive: true },
  { id: 2, name: 'Corte hombre', category: 'Corte', price: 25000, hasSalonFee: false, salonFeePercent: 0, isActive: true },
  { id: 3, name: 'Tintura completa', category: 'Tintura', price: 80000, hasSalonFee: true, salonFeePercent: 4.5, isActive: true },
  { id: 4, name: 'Manicure', category: 'Manos', price: 30000, hasSalonFee: false, salonFeePercent: 0, isActive: true },
  { id: 5, name: 'Pedicure', category: 'Pies', price: 35000, hasSalonFee: false, salonFeePercent: 0, isActive: true },
  { id: 6, name: 'Barba', category: 'Barba', price: 20000, hasSalonFee: false, salonFeePercent: 0, isActive: true },
  { id: 7, name: 'Alisado', category: 'Tratamiento', price: 120000, hasSalonFee: true, salonFeePercent: 4.5, isActive: true },
  { id: 8, name: 'Hidratación', category: 'Tratamiento', price: 60000, hasSalonFee: false, salonFeePercent: 0, isActive: false },
];

const MOCK_PRODUCTOS: Producto[] = [
  { id: 1, name: 'Shampoo Loreal', brand: 'Loreal', category: 'Cabello', purchasePrice: 18000, salePrice: 32000, stylistCommissionPercent: 10, stock: 15, isForSale: true, isActive: true },
  { id: 2, name: 'Tinte Igora Royal', brand: 'Schwarzkopf', category: 'Tintura', purchasePrice: 12000, salePrice: 0, stylistCommissionPercent: 10, stock: 20, isForSale: false, isActive: true },
  { id: 3, name: 'Oxidante 20vol', brand: 'Schwarzkopf', category: 'Tintura', purchasePrice: 8000, salePrice: 0, stylistCommissionPercent: 10, stock: 30, isForSale: false, isActive: true },
  { id: 4, name: 'Mascarilla Keratina', brand: 'Loreal', category: 'Tratamiento', purchasePrice: 22000, salePrice: 45000, stylistCommissionPercent: 10, stock: 8, isForSale: true, isActive: true },
  { id: 5, name: 'Aceite Argan', brand: 'Moroccanoil', category: 'Tratamiento', purchasePrice: 35000, salePrice: 65000, stylistCommissionPercent: 10, stock: 5, isForSale: true, isActive: true },
  { id: 6, name: 'Decolorante', brand: 'Schwarzkopf', category: 'Tintura', purchasePrice: 15000, salePrice: 0, stylistCommissionPercent: 10, stock: 12, isForSale: false, isActive: true },
];

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}`;
  private mockServicios = [...MOCK_SERVICIOS];
  private mockProductos = [...MOCK_PRODUCTOS];
  private nextServicioId = 9;
  private nextProductoId = 7;

  // ── Servicios ─────────────────────────────────────────
  getServicios(): Observable<ApiResponse<Servicio[]>> {
    if (!environment.production)
      return of({ success: true, data: [...this.mockServicios], message: '', errors: [] });
    return this.http.get<ApiResponse<Servicio[]>>(`${this.api}/services`);
  }

  crearServicio(req: CreateServicioRequest): Observable<ApiResponse<Servicio>> {
    if (!environment.production) {
      const nuevo: Servicio = { id: this.nextServicioId++, ...req, isActive: true };
      this.mockServicios.push(nuevo);
      return of({ success: true, data: nuevo, message: 'Servicio creado', errors: [] });
    }
    return this.http.post<ApiResponse<Servicio>>(`${this.api}/services`, req);
  }

  actualizarServicio(id: number, req: CreateServicioRequest): Observable<ApiResponse<Servicio>> {
    if (!environment.production) {
      const idx = this.mockServicios.findIndex(s => s.id === id);
      if (idx >= 0) this.mockServicios[idx] = { ...this.mockServicios[idx], ...req };
      return of({ success: true, data: this.mockServicios[idx >= 0 ? idx : 0], message: 'Actualizado', errors: [] });
    }
    return this.http.put<ApiResponse<Servicio>>(`${this.api}/services/${id}`, req);
  }

  toggleServicio(id: number, isActive: boolean): Observable<ApiResponse<void>> {
    if (!environment.production) {
      const s = this.mockServicios.find(s => s.id === id);
      if (s) s.isActive = isActive;
      return of({ success: true, data: undefined, message: '', errors: [] });
    }
    return this.http.patch<ApiResponse<void>>(`${this.api}/services/${id}/toggle`, { isActive });
  }

  // ── Productos ─────────────────────────────────────────
  getProductos(): Observable<ApiResponse<Producto[]>> {
    if (!environment.production)
      return of({ success: true, data: [...this.mockProductos], message: '', errors: [] });
    return this.http.get<ApiResponse<Producto[]>>(`${this.api}/products`);
  }

  crearProducto(req: CreateProductoRequest): Observable<ApiResponse<Producto>> {
    if (!environment.production) {
      const nuevo: Producto = { id: this.nextProductoId++, ...req, isActive: true };
      this.mockProductos.push(nuevo);
      return of({ success: true, data: nuevo, message: 'Producto creado', errors: [] });
    }
    return this.http.post<ApiResponse<Producto>>(`${this.api}/products`, req);
  }

  actualizarProducto(id: number, req: CreateProductoRequest): Observable<ApiResponse<Producto>> {
    if (!environment.production) {
      const idx = this.mockProductos.findIndex(p => p.id === id);
      if (idx >= 0) this.mockProductos[idx] = { ...this.mockProductos[idx], ...req };
      return of({ success: true, data: this.mockProductos[idx >= 0 ? idx : 0], message: 'Actualizado', errors: [] });
    }
    return this.http.put<ApiResponse<Producto>>(`${this.api}/products/${id}`, req);
  }

  ajustarStock(id: number, stock: number): Observable<ApiResponse<void>> {
    if (!environment.production) {
      const p = this.mockProductos.find(p => p.id === id);
      if (p) p.stock = stock;
      return of({ success: true, data: undefined, message: '', errors: [] });
    }
    return this.http.patch<ApiResponse<void>>(`${this.api}/products/${id}/stock`, { stock });
  }

  toggleProducto(id: number, isActive: boolean): Observable<ApiResponse<void>> {
    if (!environment.production) {
      const p = this.mockProductos.find(p => p.id === id);
      if (p) p.isActive = isActive;
      return of({ success: true, data: undefined, message: '', errors: [] });
    }
    return this.http.patch<ApiResponse<void>>(`${this.api}/products/${id}/toggle`, { isActive });
  }
}
