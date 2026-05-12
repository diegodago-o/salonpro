using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Domain.Interfaces;

public interface ISalonProductRepository
{
    Task<IEnumerable<SalonProduct>> GetAllByBranchAsync(int tenantId, int branchId, CancellationToken ct = default);
    Task<SalonProduct?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(SalonProduct product, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
