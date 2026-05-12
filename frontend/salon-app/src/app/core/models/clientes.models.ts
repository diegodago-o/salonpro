export interface Cliente {
  id: number;
  documentType: string;
  documentNumber: string;
  fullName: string;
  email: string;
  phone: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string | null;
  createdAt: string;
}

export interface CreateClienteRequest {
  documentType: string;
  documentNumber: string;
  fullName: string;
  email?: string;
  phone: string;
}
