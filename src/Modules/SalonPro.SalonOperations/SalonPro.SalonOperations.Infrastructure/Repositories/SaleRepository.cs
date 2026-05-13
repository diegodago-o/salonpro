using Microsoft.EntityFrameworkCore;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;

namespace SalonPro.SalonOperations.Infrastructure.Repositories;

public class SaleRepository(SalonOpsDbContext db) : ISaleRepository
{
    public async Task<IEnumerable<Sale>> GetTodayByTenantAsync(int tenantId, int? branchId = null, CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        return await db.Sales
            .Include(s => s.Payments)
            .Where(s => s.TenantId == tenantId && s.SaleDateTime >= today && s.SaleDateTime < tomorrow
                        && (branchId == null || s.BranchId == branchId))
            .OrderByDescending(s => s.SaleDateTime)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<Sale>> GetByTenantAndDateRangeAsync(int tenantId, DateTime from, DateTime to,
        int? branchId = null, CancellationToken ct = default) =>
        await db.Sales
            .Include(s => s.Payments)
            .Where(s => s.TenantId == tenantId && s.SaleDateTime >= from && s.SaleDateTime <= to
                        && (branchId == null || s.BranchId == branchId))
            .OrderByDescending(s => s.SaleDateTime)
            .ToListAsync(ct);

    public async Task<IEnumerable<Sale>> GetByStylistAndDateRangeAsync(int tenantId, int stylistId,
        DateTime from, DateTime to, int? branchId = null, CancellationToken ct = default) =>
        await db.Sales
            .Include(s => s.Payments)
            .Where(s => s.TenantId == tenantId && s.StylistId == stylistId
                        && s.SaleDateTime >= from && s.SaleDateTime <= to
                        && (branchId == null || s.BranchId == branchId))
            .OrderByDescending(s => s.SaleDateTime)
            .ToListAsync(ct);

    public async Task<Sale?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await db.Sales
            .Include(s => s.Items)
            .Include(s => s.Payments)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task AddAsync(Sale sale, CancellationToken ct = default) =>
        await db.Sales.AddAsync(sale, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
