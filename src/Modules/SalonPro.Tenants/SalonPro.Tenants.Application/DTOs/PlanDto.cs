namespace SalonPro.Tenants.Application.DTOs;

public record PlanDto(
    int Id,
    string Name,
    int MaxBranches,
    decimal PriceMonthly,
    decimal PricePerExtra,
    string? Features,
    bool IsActive
);

public record CreatePlanRequest(
    string Name,
    int MaxBranches,
    decimal PriceMonthly,
    decimal PricePerExtra,
    string? Features
);

public record UpdatePlanRequest(
    string Name,
    int MaxBranches,
    decimal PriceMonthly,
    decimal PricePerExtra,
    string? Features
);
