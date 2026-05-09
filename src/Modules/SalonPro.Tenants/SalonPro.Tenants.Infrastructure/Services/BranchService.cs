using Microsoft.EntityFrameworkCore;
using SalonPro.Shared.Interfaces;
using SalonPro.Tenants.Infrastructure.Data;

namespace SalonPro.Tenants.Infrastructure.Services;

public class BranchService(TenantsDbContext db) : IBranchService
{
    public async Task<BranchInfo?> GetByIdAsync(int branchId, CancellationToken ct = default)
    {
        var branch = await db.Branches.FindAsync([branchId], ct);
        return branch is null ? null : new BranchInfo(branch.Id, branch.TenantId, branch.Name, branch.City, branch.IsActive);
    }

    public async Task<IEnumerable<BranchInfo>> GetByTenantAsync(int tenantId, CancellationToken ct = default)
    {
        var branches = await db.Branches.Where(b => b.TenantId == tenantId && b.IsActive).ToListAsync(ct);
        return branches.Select(b => new BranchInfo(b.Id, b.TenantId, b.Name, b.City, b.IsActive));
    }
}
