using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Enums;

namespace SalonPro.SalonOperations.Domain.Interfaces;

public interface IAnticipoRepository
{
    Task<IEnumerable<Anticipo>> GetAllByTenantAsync(int tenantId, int? branchId = null, AnticipoStatus? status = null, CancellationToken ct = default);
    Task<Anticipo?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(Anticipo anticipo, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
