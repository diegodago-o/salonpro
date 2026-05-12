namespace SalonPro.Shared.Interfaces;

public interface IBranchService
{
    Task<BranchInfo?> GetByIdAsync(int branchId, CancellationToken ct = default);
    Task<IEnumerable<BranchInfo>> GetByTenantAsync(int tenantId, CancellationToken ct = default);
}

public record BranchInfo(int Id, int TenantId, string Name, string? City, bool IsActive);
