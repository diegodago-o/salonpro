using Microsoft.EntityFrameworkCore;
using SalonPro.Shared.Interfaces;
using SalonPro.Tenants.Infrastructure.Data;

namespace SalonPro.Tenants.Infrastructure.Services;

public class TenantService(TenantsDbContext db) : ITenantService
{
    public async Task<TenantInfo?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        var tenant = await db.Tenants.Include(t => t.Subscription).ThenInclude(s => s!.Plan)
            .FirstOrDefaultAsync(t => t.Slug == slug.ToLower(), ct);

        if (tenant is null) return null;
        var maxBranches = (tenant.Subscription?.Plan?.MaxBranches ?? 1) + (tenant.Subscription?.ExtraBranches ?? 0);
        return new TenantInfo(tenant.Id, tenant.BusinessName, tenant.Slug, tenant.Status.ToString(), maxBranches);
    }

    public async Task<TenantInfo?> GetByIdAsync(int tenantId, CancellationToken ct = default)
    {
        var tenant = await db.Tenants.Include(t => t.Subscription).ThenInclude(s => s!.Plan)
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct);

        if (tenant is null) return null;
        var maxBranches = (tenant.Subscription?.Plan?.MaxBranches ?? 1) + (tenant.Subscription?.ExtraBranches ?? 0);
        return new TenantInfo(tenant.Id, tenant.BusinessName, tenant.Slug, tenant.Status.ToString(), maxBranches);
    }

    public async Task<bool> IsActiveAsync(int tenantId, CancellationToken ct = default) =>
        await db.Tenants.AnyAsync(t => t.Id == tenantId && (t.Status.ToString() == "Active" || t.Status.ToString() == "Trial"), ct);

    public async Task<int> GetMaxBranchesAsync(int tenantId, CancellationToken ct = default)
    {
        var sub = await db.Subscriptions.Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.TenantId == tenantId, ct);
        return (sub?.Plan?.MaxBranches ?? 1) + (sub?.ExtraBranches ?? 0);
    }
}
