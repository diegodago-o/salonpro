using SalonPro.Tenants.Domain.Entities;

namespace SalonPro.Tenants.Domain.Interfaces;

public interface ISubscriptionRepository
{
    Task<Subscription?> GetByTenantIdAsync(int tenantId, CancellationToken ct = default);
    Task AddAsync(Subscription subscription, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
