using Microsoft.EntityFrameworkCore;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;

namespace SalonPro.SalonOperations.Infrastructure.Repositories;

public class SalonProductRepository(SalonOpsDbContext db) : ISalonProductRepository
{
    public async Task<IEnumerable<SalonProduct>> GetAllByBranchAsync(int tenantId, int branchId, CancellationToken ct = default) =>
        await db.SalonProducts
            .Where(p => p.TenantId == tenantId && p.BranchId == branchId)
            .OrderBy(p => p.Category).ThenBy(p => p.Name)
            .ToListAsync(ct);

    public async Task<SalonProduct?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await db.SalonProducts.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task AddAsync(SalonProduct product, CancellationToken ct = default) =>
        await db.SalonProducts.AddAsync(product, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
