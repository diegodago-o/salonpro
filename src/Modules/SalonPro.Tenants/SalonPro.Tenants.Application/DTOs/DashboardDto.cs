namespace SalonPro.Tenants.Application.DTOs;

public record DashboardDto(
    int TotalTenants,
    int ActiveTenants,
    int TrialTenants,
    int SuspendedTenants,
    decimal Mrr,
    IEnumerable<TenantSummaryDto> RecentTenants
);

public record TenantSummaryDto(
    int Id,
    string BusinessName,
    string Slug,
    string Status,
    DateTime CreatedAt,
    string PlanName
);
