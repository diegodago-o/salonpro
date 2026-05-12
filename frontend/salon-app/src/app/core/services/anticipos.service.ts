import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';
import { Anticipo, AnticipoStatus, CreateAnticipoRequest } from '../models/anticipos.models';

const MOCK_ANTICIPOS: Anticipo[] = [
  { id: 1, clientName: 'Ana López', clientDocument: '1234567890', clientPhone: '3001234567', amount: 50000, paymentMethodName: 'Nequi', notes: 'Reserva alisado', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), status: 'Active' },
  { id: 2, clientName: 'Carlos Medina', clientDocument: '9876543210', clientPhone: '3109876543', amount: 30000, paymentMethodName: 'Efectivo', notes: '', createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), status: 'Applied' },
  { id: 3, clientName: 'Maria Gómez', clientDocument: 'E123456', clientPhone: '3001112233', amount: 80000, paymentMethodName: 'Transferencia', notes: 'Reserva tintura + tratamiento', createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'Active' },
];

@Injectable({ providedIn: 'root' })
export class AnticipasService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}`;
  private mockData = [...MOCK_ANTICIPOS];
  private nextId = 4;

  getAnticipos(status?: AnticipoStatus): Observable<ApiResponse<Anticipo[]>> {
    if (!environment.production) {
      const data = status ? this.mockData.filter(a => a.status === status) : [...this.mockData];
      return of({ success: true, data, message: '', errors: [] });
    }
    const params = status ? `?status=${status}` : '';
    return this.http.get<ApiResponse<Anticipo[]>>(`${this.api}/anticipos${params}`);
  }

  crearAnticipo(req: CreateAnticipoRequest): Observable<ApiResponse<Anticipo>> {
    if (!environment.production) {
      const nuevo: Anticipo = {
        id: this.nextId++,
        clientName: req.clientFullName, clientDocument: req.clientDocumentNumber,
        clientPhone: req.clientPhone, amount: req.amount,
        paymentMethodName: 'Efectivo', notes: req.notes,
        createdAt: new Date().toISOString(), status: 'Active',
      };
      this.mockData.unshift(nuevo);
      return of({ success: true, data: nuevo, message: 'Anticipo registrado', errors: [] });
    }
    return this.http.post<ApiResponse<Anticipo>>(`${this.api}/anticipos`, req);
  }

  anularAnticipo(id: number): Observable<ApiResponse<void>> {
    if (!environment.production) {
      const a = this.mockData.find(a => a.id === id);
      if (a) a.status = 'Voided';
      return of({ success: true, data: undefined, message: 'Anulado', errors: [] });
    }
    return this.http.patch<ApiResponse<void>>(`${this.api}/anticipos/${id}/void`, {});
  }
}
