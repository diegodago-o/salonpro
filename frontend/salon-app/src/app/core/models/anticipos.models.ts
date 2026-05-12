export type AnticipoStatus = 'Active' | 'Applied' | 'Voided';

export interface Anticipo {
  id: number;
  clientName: string;
  clientDocument: string;
  clientPhone: string;
  amount: number;
  paymentMethodName: string;
  notes?: string;
  createdAt: string;
  status: AnticipoStatus;
}

export interface CreateAnticipoRequest {
  clientDocumentType: string;
  clientDocumentNumber: string;
  clientFullName: string;
  clientPhone: string;
  amount: number;
  paymentMethodId: number;
  notes?: string;
}
