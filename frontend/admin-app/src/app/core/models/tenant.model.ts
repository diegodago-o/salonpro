export interface Tenant {
  id: number;
  businessName: string;
  tradeName: string | null;
  nit: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  logoUrl: string | null;
  status: TenantStatus;
  trialEndsAt: string | null;
  createdAt: string;
  subscription: Subscription | null;
  branchCount: number;
}

export type TenantStatus = 'Trial' | 'Active' | 'Suspended' | 'Cancelled';

export interface Subscription {
  id: number;
  planId: number;
  planName: string;
  extraBranches: number;
  totalMonthly: number;
  billingCycle: string;
  startDate: string;
  nextBillingDate: string | null;
  status: string;
}

export interface CreateTenantRequest {
  businessName: string;
  tradeName: string | null;
  nit: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  planId: number;
  extraBranches: number;
  billingCycle: string;
  branchName: string;
  branchAddress: string | null;
  branchCity: string | null;
  branchPhone: string | null;
  ownerEmail: string;
  ownerFullName: string;
  ownerPassword: string;
  ownerDocument: string;
}

export interface CreateTenantResponse {
  tenant: Tenant;
  ownerEmail: string;
  ownerPassword: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Branch {
  id: number;
  tenantId: number;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBranchRequest {
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
}

export interface UpdateSubscriptionRequest {
  planId: number;
  extraBranches: number;
  billingCycle: string;
}
