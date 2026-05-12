namespace SalonPro.Shared.Interfaces;

public interface ITenantService
{
    Task<TenantInfo?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<TenantInfo?> GetByIdAsync(int tenantId, CancellationToken ct = default);
    Task<bool> IsActiveAsync(int tenantId, CancellationToken ct = default);
    Task<int> GetMaxBranchesAsync(int tenantId, CancellationToken ct = default);
}

public record TenantInfo(int Id, string BusinessName, string Slug, string Status, int MaxBranches);
