namespace SalonPro.Tenants.Application.DTOs;

public record CreateTenantResponse(
    TenantDto Tenant,
    string OwnerEmail,
    string OwnerPassword
);

public record TenantDto(
    int Id,
    string BusinessName,
    string? TradeName,
    string Nit,
    string Slug,
    string Email,
    string? Phone,
    string? Address,
    string? City,
    string? LogoUrl,
    string Status,
    DateTime? TrialEndsAt,
    DateTime CreatedAt,
    SubscriptionDto? Subscription,
    int BranchCount
);

public record CreateTenantRequest(
    string BusinessName,
    string? TradeName,
    string Nit,
    string Slug,
    string Email,
    string? Phone,
    string? Address,
    string? City,
    int PlanId,
    int ExtraBranches,
    string BillingCycle,
    string BranchName,
    string? BranchAddress,
    string? BranchCity,
    string? BranchPhone,
    string OwnerEmail,
    string OwnerFullName,
    string OwnerPassword,
    string OwnerDocument
);

public record UpdateTenantRequest(
    string BusinessName,
    string? TradeName,
    string? Phone,
    string? Address,
    string? City,
    string? LogoUrl
);

public record ChangeTenantStatusRequest(string Status, string? Reason);
