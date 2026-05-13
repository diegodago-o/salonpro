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
  /** Porcentaje de comisión del estilista sobre el precio neto de este producto (0–100). Default: 10 */
  stylistCommissionPercent: number;
  stock: number;
  isForSale: boolean;
}

export interface StylistOption {
  id: number;
  fullName: string;
  commissionPercent: number;
  employeeCode?: string | null;
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
  /** Comisión del estilista sobre este producto (0–100). Default: 10 */
  stylistCommissionPercent: number;
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
  commissionPercent: number;
  branchId?: number;
  branchName?: string;
  clientDocumentType: string;
  clientDocumentNumber: string;
  clientFullName: string;
  clientEmail?: string;
  clientPhone?: string;
  payments: { paymentMethodId: number; amount: number }[];
  tipAmount: number;
  notes?: string;
  services: { serviceId: number; price: number }[];
  productsSold: { productId: number; price: number }[];
  productsInternal: { productId: number; price: number }[];
}

// Ítem de una venta (detalle)
export interface SaleItemDto {
  id: number;
  type: 'Service' | 'ProductSale' | 'ProductInternal';
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  salonFeePercent: number;
}

// Pago de una venta (detalle)
export interface SalePaymentDto {
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
  deductionPercent: number;
  deductionAmount: number;
}

// Venta completa (response)
export interface Sale {
  id: number;
  saleDateTime: string;
  // Peluquero
  stylistId: number;
  stylistName: string;
  commissionPercent: number;
  // Cliente
  clientName: string;
  clientDocument: string;
  clientDocumentType?: string;
  clientEmail?: string;
  clientPhone?: string;
  // Ubicación
  branchName?: string;
  // Pago primario (compatibilidad)
  paymentMethodName: string;
  // Financiero
  grossServices: number;
  grossProducts: number;
  internalConsumption: number;
  tipAmount: number;
  totalDeductions: number;
  grossTotal: number;
  stylistTotal: number;
  salonTotal: number;
  // Estado
  status: SaleStatus;
  voidedReason?: string;
  notes?: string;
  // Detalle (null en lista, cargado al abrir modal)
  items?: SaleItemDto[];
  payments?: SalePaymentDto[];
}
