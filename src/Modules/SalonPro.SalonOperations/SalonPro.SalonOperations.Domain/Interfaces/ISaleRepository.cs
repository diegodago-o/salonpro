using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Domain.Interfaces;

public interface ISaleRepository
{
    Task<IEnumerable<Sale>> GetTodayByTenantAsync(int tenantId, CancellationToken ct = default);
    Task<IEnumerable<Sale>> GetByTenantAndDateRangeAsync(int tenantId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<IEnumerable<Sale>> GetByStylistAndDateRangeAsync(int tenantId, int stylistId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<Sale?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(Sale sale, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
