using Microsoft.EntityFrameworkCore;
using SalonPro.Tenants.Domain.Entities;
using SalonPro.Tenants.Domain.Interfaces;
using SalonPro.Tenants.Infrastructure.Data;

namespace SalonPro.Tenants.Infrastructure.Repositories;

public class SubscriptionRepository(TenantsDbContext db) : ISubscriptionRepository
{
    public async Task<Subscription?> GetByTenantIdAsync(int tenantId, CancellationToken ct = default) =>
        await db.Subscriptions.Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.TenantId == tenantId, ct);

    public async Task AddAsync(Subscription subscription, CancellationToken ct = default) =>
        await db.Subscriptions.AddAsync(subscription, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
