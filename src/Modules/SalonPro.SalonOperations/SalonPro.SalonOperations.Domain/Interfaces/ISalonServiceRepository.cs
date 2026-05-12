using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Domain.Interfaces;

public interface ISalonServiceRepository
{
    Task<IEnumerable<SalonService>> GetAllByBranchAsync(int tenantId, int branchId, CancellationToken ct = default);
    Task<SalonService?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(SalonService service, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
