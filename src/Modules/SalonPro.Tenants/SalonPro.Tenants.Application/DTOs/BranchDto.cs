namespace SalonPro.Tenants.Application.DTOs;

public record BranchDto(
    int Id,
    int TenantId,
    string Name,
    string? Address,
    string? City,
    string? Phone,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateBranchRequest(
    string Name,
    string? Address,
    string? City,
    string? Phone
);

public record UpdateBranchRequest(
    string Name,
    string? Address,
    string? City,
    string? Phone
);
