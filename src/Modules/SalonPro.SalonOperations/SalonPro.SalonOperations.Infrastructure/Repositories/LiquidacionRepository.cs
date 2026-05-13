using Microsoft.EntityFrameworkCore;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;

namespace SalonPro.SalonOperations.Infrastructure.Repositories;

public class LiquidacionRepository(SalonOpsDbContext db) : ILiquidacionRepository
{
    public async Task<IEnumerable<Liquidacion>> GetAllByTenantAsync(int tenantId, int? branchId = null, CancellationToken ct = default)
    {
        var query = db.Liquidaciones.Where(l => l.TenantId == tenantId);
        if (branchId.HasValue && branchId.Value > 0)
            query = query.Where(l => l.BranchId == branchId.Value || l.BranchId == null);
        return await query.OrderByDescending(l => l.StartDate).ToListAsync(ct);
    }

    public async Task<Liquidacion?> GetByIdWithVentasAsync(int id, CancellationToken ct = default) =>
        await db.Liquidaciones
            .Include(l => l.Ventas)
            .FirstOrDefaultAsync(l => l.Id == id, ct);

    public async Task AddAsync(Liquidacion liquidacion, CancellationToken ct = default) =>
        await db.Liquidaciones.AddAsync(liquidacion, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
