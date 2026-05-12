using Microsoft.EntityFrameworkCore;
using SalonPro.Tenants.Domain.Entities;
using SalonPro.Tenants.Domain.Interfaces;
using SalonPro.Tenants.Infrastructure.Data;

namespace SalonPro.Tenants.Infrastructure.Repositories;

public class PlanRepository(TenantsDbContext db) : IPlanRepository
{
    public async Task<Plan?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await db.Plans.FindAsync([id], ct);

    public async Task<IEnumerable<Plan>> GetAllAsync(bool onlyActive = false, CancellationToken ct = default)
    {
        var query = db.Plans.AsQueryable();
        if (onlyActive) query = query.Where(p => p.IsActive);
        return await query.OrderBy(p => p.PriceMonthly).ToListAsync(ct);
    }

    public async Task AddAsync(Plan plan, CancellationToken ct = default) =>
        await db.Plans.AddAsync(plan, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
