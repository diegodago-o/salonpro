import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';
import {
  AnticipoColaborador,
  AnticipoColaboradorStatus,
  CreateAnticipoColaboradorRequest
} from '../models/anticipos-colaborador.models';

const MOCK: AnticipoColaborador[] = [
  {
    id: 1, stylistId: 1, stylistName: 'Diego', amount: 150000,
    date: '2026-05-20', notes: 'Anticipo quincena', status: 'Pendiente',
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString()
  },
  {
    id: 2, stylistId: 2, stylistName: 'Valentina', amount: 80000,
    date: '2026-05-10', notes: '', status: 'Aplicado', liquidacionId: 3,
    createdAt: new Date(Date.now() - 19 * 86400000).toISOString()
  },
  {
    id: 3, stylistId: 1, stylistName: 'Diego', amount: 50000,
    date: '2026-05-25', notes: 'Préstamo urgente', status: 'Pendiente',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
];

@Injectable({ providedIn: 'root' })
export class AnticiposColaboradorService {
  private readonly http = inject(HttpClient);
  private readonly api  = `${environment.apiUrl}`;
  private mockData      = [...MOCK];
  private nextId        = 4;

  getAnticipos(
    stylistId?: number | null,
    status?: AnticipoColaboradorStatus,
    branchId?: number | null
  ): Observable<ApiResponse<AnticipoColaborador[]>> {
    if (!environment.production) {
      let data = [...this.mockData];
      if (stylistId) data = data.filter(a => a.stylistId === stylistId);
      if (status)    data = data.filter(a => a.status    === status);
      return of({ success: true, data, message: '', errors: [] });
    }
    const qs = new URLSearchParams();
    if (stylistId) qs.set('stylistId', String(stylistId));
    if (status)    qs.set('status',    status);
    if (branchId)  qs.set('branchId',  String(branchId));
    const params = qs.toString() ? `?${qs.toString()}` : '';
    return this.http.get<ApiResponse<AnticipoColaborador[]>>(`${this.api}/anticipos-colaborador${params}`);
  }

  crearAnticipo(req: CreateAnticipoColaboradorRequest): Observable<ApiResponse<AnticipoColaborador>> {
    if (!environment.production) {
      const nuevo: AnticipoColaborador = {
        id: this.nextId++,
        stylistId:   req.stylistId,
        stylistName: req.stylistName,
        amount:      req.amount,
        date:        req.date,
        notes:       req.notes,
        status:      'Pendiente',
        createdAt:   new Date().toISOString()
      };
      this.mockData.unshift(nuevo);
      return of({ success: true, data: nuevo, message: 'Anticipo registrado', errors: [] });
    }
    return this.http.post<ApiResponse<AnticipoColaborador>>(`${this.api}/anticipos-colaborador`, req);
  }

  anularAnticipo(id: number): Observable<ApiResponse<void>> {
    if (!environment.production) {
      const a = this.mockData.find(a => a.id === id);
      if (a) a.status = 'Anulado';
      return of({ success: true, data: undefined, message: 'Anulado', errors: [] });
    }
    return this.http.patch<ApiResponse<void>>(`${this.api}/anticipos-colaborador/${id}/void`, {});
  }
}
