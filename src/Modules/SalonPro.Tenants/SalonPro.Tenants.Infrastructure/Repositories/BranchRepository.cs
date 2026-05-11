using Microsoft.EntityFrameworkCore;
using SalonPro.Tenants.Domain.Entities;
using SalonPro.Tenants.Domain.Interfaces;
using SalonPro.Tenants.Infrastructure.Data;

namespace SalonPro.Tenants.Infrastructure.Repositories;

public class BranchRepository(TenantsDbContext db) : IBranchRepository
{
    public async Task<Branch?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await db.Branches.FindAsync([id], ct);

    public async Task<IEnumerable<Branch>> GetByTenantAsync(int tenantId, bool onlyActive = false, CancellationToken ct = default)
    {
        var query = db.Branches.Where(b => b.TenantId == tenantId);
        if (onlyActive) query = query.Where(b => b.IsActive);
        return await query.OrderBy(b => b.Name).ToListAsync(ct);
    }

    public async Task<int> CountByTenantAsync(int tenantId, CancellationToken ct = default) =>
        await db.Branches.CountAsync(b => b.TenantId == tenantId && b.IsActive, ct);

    public async Task AddAsync(Branch branch, CancellationToken ct = default) =>
        await db.Branches.AddAsync(branch, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
