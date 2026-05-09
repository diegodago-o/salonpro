using SalonPro.Tenants.Domain.Entities;

namespace SalonPro.Tenants.Domain.Interfaces;

public interface IBranchRepository
{
    Task<Branch?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<Branch>> GetByTenantAsync(int tenantId, bool onlyActive = false, CancellationToken ct = default);
    Task<int> CountByTenantAsync(int tenantId, CancellationToken ct = default);
    Task AddAsync(Branch branch, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
