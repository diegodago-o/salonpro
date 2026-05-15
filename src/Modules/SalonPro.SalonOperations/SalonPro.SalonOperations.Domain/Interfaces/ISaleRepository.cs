using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Domain.Interfaces;

public interface ISaleRepository
{
    Task<IEnumerable<Sale>> GetAllByTenantAsync(int tenantId, int? branchId = null, string? branchName = null, CancellationToken ct = default);
    Task<IEnumerable<Sale>> GetTodayByTenantAsync(int tenantId, int? branchId = null, string? branchName = null, CancellationToken ct = default);
    Task<IEnumerable<Sale>> GetByTenantAndDateRangeAsync(int tenantId, DateTime from, DateTime to, int? branchId = null, string? branchName = null, CancellationToken ct = default);
    Task<IEnumerable<Sale>> GetByStylistAndDateRangeAsync(int tenantId, int stylistId, DateTime from, DateTime to, int? branchId = null, string? branchName = null, CancellationToken ct = default);
    Task<Sale?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(Sale sale, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
