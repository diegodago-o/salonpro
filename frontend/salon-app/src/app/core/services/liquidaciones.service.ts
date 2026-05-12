import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';
import { CreateLiquidacionRequest, LiquidacionDetalle, LiquidacionResumen } from '../models/liquidaciones.models';

const hoy = new Date();
const hace7 = new Date(Date.now() - 7 * 86400000);
const hace14 = new Date(Date.now() - 14 * 86400000);

const MOCK_LIQUIDACIONES: LiquidacionResumen[] = [
  {
    id: 1, stylistId: 1, stylistName: 'Carlos Restrepo',
    startDate: hace14.toISOString(), endDate: hace7.toISOString(),
    totalVentas: 8, grossServices: 520000, grossProducts: 64000,
    totalDeductions: 41160, commServices: 239420, commProducts: 6400,
    totalTips: 25000, internalConsumption: 36000, anticiposAplicados: 30000,
    netoPeluquero: 240820, status: 'Closed',
  },
  {
    id: 2, stylistId: 2, stylistName: 'María López',
    startDate: hace7.toISOString(), endDate: hoy.toISOString(),
    totalVentas: 5, grossServices: 310000, grossProducts: 0,
    totalDeductions: 21700, commServices: 129735, commProducts: 0,
    totalTips: 15000, internalConsumption: 20000, anticiposAplicados: 50000,
    netoPeluquero: 74735, status: 'Open',
  },
  {
    id: 3, stylistId: 3, stylistName: 'Andrés Gómez',
    startDate: hace7.toISOString(), endDate: hoy.toISOString(),
    totalVentas: 3, grossServices: 145000, grossProducts: 32000,
    totalDeductions: 0, commServices: 58000, commProducts: 3200,
    totalTips: 0, internalConsumption: 12000, anticiposAplicados: 0,
    netoPeluquero: 49200, status: 'Open',
  },
];

@Injectable({ providedIn: 'root' })
export class LiquidacionesService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}`;
  private mockData = [...MOCK_LIQUIDACIONES];
  private nextId = 4;

  getLiquidaciones(): Observable<ApiResponse<LiquidacionResumen[]>> {
    if (!environment.production)
      return of({ success: true, data: [...this.mockData], message: '', errors: [] });
    return this.http.get<ApiResponse<LiquidacionResumen[]>>(`${this.api}/liquidaciones`);
  }

  getDetalle(id: number): Observable<ApiResponse<LiquidacionDetalle>> {
    if (!environment.production) {
      const base = this.mockData.find(l => l.id === id)!;
      const detalle: LiquidacionDetalle = {
        ...base,
        ventas: [
          { saleId: 101, saleDateTime: hace7.toISOString(), clientName: 'Ana López', grossServices: 80000, grossProducts: 32000, deduction: 7840, commServices: 33688, commProducts: 3200, tip: 10000, internalConsumption: 12000 },
          { saleId: 102, saleDateTime: new Date(Date.now() - 5 * 86400000).toISOString(), clientName: 'Carlos Medina', grossServices: 35000, grossProducts: 0, deduction: 2450, commServices: 16275, commProducts: 0, tip: 5000, internalConsumption: 0 },
        ],
      };
      return of({ success: true, data: detalle, message: '', errors: [] });
    }
    return this.http.get<ApiResponse<LiquidacionDetalle>>(`${this.api}/liquidaciones/${id}`);
  }

  crearLiquidacion(req: CreateLiquidacionRequest): Observable<ApiResponse<LiquidacionResumen>> {
    if (!environment.production) {
      const nueva: LiquidacionResumen = {
        id: this.nextId++, stylistId: req.stylistId, stylistName: 'Peluquero',
        startDate: req.startDate, endDate: req.endDate,
        totalVentas: 0, grossServices: 0, grossProducts: 0,
        totalDeductions: 0, commServices: 0, commProducts: 0,
        totalTips: 0, internalConsumption: 0, anticiposAplicados: 0,
        netoPeluquero: 0, status: 'Open',
      };
      this.mockData.unshift(nueva);
      return of({ success: true, data: nueva, message: 'Liquidación creada', errors: [] });
    }
    return this.http.post<ApiResponse<LiquidacionResumen>>(`${this.api}/liquidaciones`, req);
  }

  cerrarLiquidacion(id: number): Observable<ApiResponse<void>> {
    if (!environment.production) {
      const l = this.mockData.find(l => l.id === id);
      if (l) l.status = 'Closed';
      return of({ success: true, data: undefined, message: 'Cerrada', errors: [] });
    }
    return this.http.patch<ApiResponse<void>>(`${this.api}/liquidaciones/${id}/close`, {});
  }
}
