export type AnticipoColaboradorStatus = 'Pendiente' | 'Aplicado' | 'Anulado';

export interface AnticipoColaborador {
  id: number;
  stylistId: number;
  stylistName: string;
  amount: number;
  date: string;           // yyyy-MM-dd
  notes?: string;
  status: AnticipoColaboradorStatus;
  liquidacionId?: number;
  createdAt: string;
}

export interface CreateAnticipoColaboradorRequest {
  stylistId: number;
  stylistName: string;
  amount: number;
  date: string;           // yyyy-MM-dd
  notes?: string;
}
