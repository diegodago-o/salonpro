import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';
import { Cliente, CreateClienteRequest } from '../models/clientes.models';

const MOCK_CLIENTES: Cliente[] = [
  { id: 1, documentType: 'CC', documentNumber: '1234567890', fullName: 'Ana López', email: 'ana@email.com', phone: '3001234567', totalVisits: 8, totalSpent: 520000, lastVisit: new Date(Date.now() - 7 * 86400000).toISOString(), createdAt: '2024-01-15T10:00:00Z' },
  { id: 2, documentType: 'CC', documentNumber: '9876543210', fullName: 'Carlos Medina', email: 'carlos@email.com', phone: '3109876543', totalVisits: 15, totalSpent: 875000, lastVisit: new Date(Date.now() - 2 * 86400000).toISOString(), createdAt: '2023-11-20T09:00:00Z' },
  { id: 3, documentType: 'CC', documentNumber: '5551234567', fullName: 'Valentina Torres', email: '', phone: '3205551234', totalVisits: 3, totalSpent: 195000, lastVisit: new Date(Date.now() - 14 * 86400000).toISOString(), createdAt: '2024-03-08T14:00:00Z' },
  { id: 4, documentType: 'CE', documentNumber: 'E123456', fullName: 'Maria Gómez', email: 'maria@email.com', phone: '3001112233', totalVisits: 22, totalSpent: 1340000, lastVisit: new Date().toISOString(), createdAt: '2023-08-01T08:00:00Z' },
  { id: 5, documentType: 'CC', documentNumber: '3337778889', fullName: 'Juan Pérez', email: 'juan@email.com', phone: '3154447788', totalVisits: 1, totalSpent: 25000, lastVisit: new Date(Date.now() - 30 * 86400000).toISOString(), createdAt: '2024-04-22T11:00:00Z' },
];

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}`;
  private mockData = [...MOCK_CLIENTES];
  private nextId = 6;

  getClientes(): Observable<ApiResponse<Cliente[]>> {
    if (!environment.production)
      return of({ success: true, data: [...this.mockData], message: '', errors: [] });
    return this.http.get<ApiResponse<Cliente[]>>(`${this.api}/clients`);
  }

  buscarPorDocumento(doc: string): Observable<ApiResponse<Cliente | null>> {
    if (!environment.production) {
      const found = this.mockData.find(c => c.documentNumber === doc) ?? null;
      return of({ success: true, data: found, message: '', errors: [] });
    }
    return this.http.get<ApiResponse<Cliente | null>>(`${this.api}/clients/search?document=${doc}`);
  }

  crearCliente(req: CreateClienteRequest): Observable<ApiResponse<Cliente>> {
    if (!environment.production) {
      const nuevo: Cliente = {
        id: this.nextId++,
        ...req, email: req.email ?? '',
        totalVisits: 0, totalSpent: 0, lastVisit: null,
        createdAt: new Date().toISOString(),
      };
      this.mockData.unshift(nuevo);
      return of({ success: true, data: nuevo, message: 'Cliente creado', errors: [] });
    }
    return this.http.post<ApiResponse<Cliente>>(`${this.api}/clients`, req);
  }

  actualizarCliente(id: number, req: CreateClienteRequest): Observable<ApiResponse<Cliente>> {
    if (!environment.production) {
      const idx = this.mockData.findIndex(c => c.id === id);
      if (idx >= 0) this.mockData[idx] = { ...this.mockData[idx], ...req, email: req.email ?? '' };
      return of({ success: true, data: this.mockData[idx >= 0 ? idx : 0], message: 'Actualizado', errors: [] });
    }
    return this.http.put<ApiResponse<Cliente>>(`${this.api}/clients/${id}`, req);
  }
}
