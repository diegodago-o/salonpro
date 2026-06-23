import { SaleItem, StylistOption } from './ventas.models';

export interface SaleGroup {
  stylist: StylistOption | null;
  items: SaleItem[];
  abierto: boolean;
}

export interface CreateTicketRequest {
  clientDocumentType: string;
  clientDocumentNumber: string;
  clientFullName: string;
  clientEmail?: string;
  clientPhone?: string;
  branchId?: number;
  branchName?: string;
  payments: { paymentMethodId: number; amount: number }[];
  tipAmount: number;
  notes?: string;
  groups: {
    stylistId: number;
    stylistName: string;
    commissionPercent: number;
    services: { serviceId: number; price: number }[];
    productsSold: { productId: number; price: number }[];
    productsInternal: { productId: number; price: number }[];
  }[];
  saleDateTime?: string;
}

export interface TicketDto {
  id: number;
  clientName: string;
  saleDateTime: string;
  grossTotal: number;
  tipAmount: number;
  status: string;
  saleIds: number[];
}
