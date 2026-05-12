namespace SalonPro.Tenants.Application.DTOs;

public record SubscriptionDto(
    int Id,
    int PlanId,
    string PlanName,
    int ExtraBranches,
    decimal TotalMonthly,
    string BillingCycle,
    DateTime StartDate,
    DateTime? NextBillingDate,
    string Status
);

public record UpdateSubscriptionRequest(
    int PlanId,
    int ExtraBranches,
    string BillingCycle
);
