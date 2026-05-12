export type CajaStatus = 'Open' | 'Closed';

export interface CashRegister {
  id: number;
  branchId: number;
  branchName: string;
  cashierId: number;
  cashierName: string;
  openedAt: string;
  closedAt: string | null;
  openingBalance: number;
  declaredCash: number | null;
  expectedCash: number | null;
  difference: number | null;
  status: CajaStatus;
  notes: string | null;
  details: CashRegisterDetail[];
}

export interface CashRegisterDetail {
  paymentMethodId: number;
  paymentMethodName: string;
  totalAmount: number;
  totalDeductions: number;
  netAmount: number;
}

export interface OpenCajaRequest {
  openingBalance: number;
  notes?: string;
}

export interface CloseCajaRequest {
  declaredCash: number;
  notes?: string;
}
