export type LiquidacionStatus = 'Open' | 'Closed';

export interface LiquidacionResumen {
  id: number;
  stylistId: number;
  stylistName: string;
  startDate: string;
  endDate: string;
  totalVentas: number;
  grossServices: number;
  grossProducts: number;
  totalDeductions: number;
  commServices: number;
  commProducts: number;
  totalTips: number;
  internalConsumption: number;
  anticiposAplicados: number;
  netoPeluquero: number;
  status: LiquidacionStatus;
}

export interface DeduccionDetalle {
  paymentMethodName: string;
  deductionPercent: number;
  totalAmount: number;
}

export interface LiquidacionVenta {
  saleId: number;
  saleDateTime: string;
  clientName: string;
  grossServices: number;
  grossProducts: number;
  deduction: number;
  commServices: number;
  commProducts: number;
  tip: number;
  internalConsumption: number;
  paymentMethodsSummary: string;
}

export interface LiquidacionDetalle extends LiquidacionResumen {
  ventas: LiquidacionVenta[];
  deduccionesDetalle: DeduccionDetalle[];
}

export interface CreateLiquidacionRequest {
  stylistId: number;
  stylistName: string;
  startDate: string;
  endDate: string;
}
