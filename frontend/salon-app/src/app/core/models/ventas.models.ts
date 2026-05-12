export type SaleDetailType = 'Service' | 'ProductSale' | 'ProductInternal';
export type SaleStatus = 'Active' | 'Voided' | 'Edited';

export interface ServiceOption {
  id: number;
  name: string;
  category: string;
  price: number;
  hasSalonFee: boolean;
  salonFeePercent: number;
}

export interface ProductOption {
  id: number;
  name: string;
  brand: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  isForSale: boolean;
}

export interface StylistOption {
  id: number;
  fullName: string;
  commissionPercent: number;
}

export interface PaymentMethodOption {
  id: number;
  name: string;
  hasDeduction: boolean;
  deductionPercent: number;
}

export interface ClientOption {
  id: number;
  documentType: string;
  documentNumber: string;
  fullName: string;
  email: string;
  phone: string;
}

// Items del carrito
export interface SaleServiceItem {
  type: 'Service';
  serviceId: number;
  name: string;
  price: number;       // editable por el cajero
  quantity: number;    // editable, mín 1
  hasSalonFee: boolean;
  salonFeePercent: number;
}

export interface SaleProductItem {
  type: 'ProductSale' | 'ProductInternal';
  productId: number;
  name: string;
  price: number;    // editable
  quantity: number; // editable, mín 1
}

export type SaleItem = SaleServiceItem | SaleProductItem;

// Resultado del motor de cálculo
export interface SaleCalculation {
  // Brutos
  grossServices: number;
  grossProducts: number;
  grossTip: number;
  internalConsumption: number;

  // Deducciones
  deductionPct: number;
  deductionServices: number;
  deductionProducts: number;
  deductionTip: number;
  totalDeductions: number;

  // Bases netas
  baseServices: number;
  baseProducts: number;
  netTip: number;

  // Comisiones
  stylistCommPct: number;
  salonFeeServices: number;     // suma de fees por salón (hasSalonFee) sobre base neta
  stylistCommServices: number;
  salonCommServices: number;
  stylistCommProducts: number;
  salonCommProducts: number;

  // Netos
  stylistTotal: number;
  salonTotal: number;
}

export interface PaymentEntry {
  paymentMethodId: number | null;
  amount: number;
}

// Request para crear venta
export interface CreateSaleRequest {
  stylistId: number;
  stylistName: string;
  clientDocumentType: string;
  clientDocumentNumber: string;
  clientFullName: string;
  clientEmail: string;
  clientPhone: string;
  payments: { paymentMethodId: number; amount: number }[];
  tipAmount: number;
  notes?: string;
  services: { serviceId: number; price: number }[];
  productsSold: { productId: number; price: number }[];
  productsInternal: { productId: number; price: number }[];
}

// Venta completa (response)
export interface Sale {
  id: number;
  saleDateTime: string;
  stylistName: string;
  clientName: string;
  clientDocument: string;
  paymentMethodName: string;
  grossTotal: number;
  totalDeductions: number;
  stylistTotal: number;
  salonTotal: number;
  tipAmount: number;
  status: SaleStatus;
  voidedReason?: string;
}
