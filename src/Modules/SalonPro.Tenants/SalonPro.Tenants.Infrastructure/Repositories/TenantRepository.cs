using Microsoft.EntityFrameworkCore;
using SalonPro.Tenants.Domain.Entities;
using SalonPro.Tenants.Domain.Enums;
using SalonPro.Tenants.Domain.Interfaces;
using SalonPro.Tenants.Infrastructure.Data;

namespace SalonPro.Tenants.Infrastructure.Repositories;

public class TenantRepository(TenantsDbContext db) : ITenantRepository
{
    public async Task<Tenant?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await db.Tenants.Include(t => t.Subscription).ThenInclude(s => s!.Plan)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task<Tenant?> GetBySlugAsync(string slug, CancellationToken ct = default) =>
        await db.Tenants.FirstOrDefaultAsync(t => t.Slug == slug.ToLower(), ct);

    public async Task<Tenant?> GetByNitAsync(string nit, CancellationToken ct = default) =>
        await db.Tenants.FirstOrDefaultAsync(t => t.Nit == nit, ct);

    public async Task<(IEnumerable<Tenant> Items, int Total)> GetPagedAsync(
        string? search, TenantStatus? status, int page, int pageSize, CancellationToken ct = default)
    {
        var query = db.Tenants.Include(t => t.Subscription).ThenInclude(s => s!.Plan).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(t => t.BusinessName.Contains(search) || t.Slug.Contains(search) || t.Nit.Contains(search));

        if (status.HasValue)
            query = query.Where(t => t.Status == status.Value);

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return (items, total);
    }

    public async Task<int> CountByStatusAsync(TenantStatus status, CancellationToken ct = default) =>
        await db.Tenants.CountAsync(t => t.Status == status, ct);

    public async Task AddAsync(Tenant tenant, CancellationToken ct = default) =>
        await db.Tenants.AddAsync(tenant, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
