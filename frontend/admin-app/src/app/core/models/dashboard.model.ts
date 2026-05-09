export interface Dashboard {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  mrr: number;
  recentTenants: TenantSummary[];
}

export interface TenantSummary {
  id: number;
  businessName: string;
  slug: string;
  status: string;
  createdAt: string;
  planName: string;
}
