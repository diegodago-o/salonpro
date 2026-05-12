using SalonPro.Tenants.Domain.Entities;

namespace SalonPro.Tenants.Domain.Interfaces;

public interface IPlanRepository
{
    Task<Plan?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<Plan>> GetAllAsync(bool onlyActive = false, CancellationToken ct = default);
    Task AddAsync(Plan plan, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
