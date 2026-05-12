export interface Plan {
  id: number;
  name: string;
  maxBranches: number;
  priceMonthly: number;
  pricePerExtra: number;
  features: string | null;
  isActive: boolean;
}

export interface CreatePlanRequest {
  name: string;
  maxBranches: number;
  priceMonthly: number;
  pricePerExtra: number;
  features: string | null;
}
