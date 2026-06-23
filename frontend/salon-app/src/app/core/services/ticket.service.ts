import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';
import { CreateTicketRequest, TicketDto } from '../models/ticket.models';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly api  = `${environment.apiUrl}`;

  crearTicket(req: CreateTicketRequest): Observable<ApiResponse<TicketDto>> {
    if (!environment.production) {
      const mock: TicketDto = {
        id: Math.floor(Math.random() * 9000) + 1000,
        clientName: req.clientFullName,
        saleDateTime: new Date().toISOString(),
        grossTotal: req.payments.reduce((s, p) => s + p.amount, 0),
        tipAmount: req.tipAmount,
        status: 'Active',
        saleIds: req.groups.map((_, i) => i + 100),
      };
      return of({ success: true, data: mock, message: 'Venta registrada', errors: [] });
    }
    return this.http.post<ApiResponse<TicketDto>>(`${this.api}/tickets`, req);
  }
}
