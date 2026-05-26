using Microsoft.EntityFrameworkCore;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;
using SalonPro.Shared.Common;

namespace SalonPro.SalonOperations.Infrastructure.Repositories;

public class SaleRepository(SalonOpsDbContext db) : ISaleRepository
{
    // Filtro por sede: sin branchId → todo el tenant; con branchId → solo esa sede (estricto)
    public async Task<IEnumerable<Sale>> GetAllByTenantAsync(int tenantId, int? branchId = null, string? branchName = null, CancellationToken ct = default) =>
        await db.Sales
            .Include(s => s.Payments)
            .Where(s => s.TenantId == tenantId
                        && (branchId == null || s.BranchId == branchId))
            .OrderByDescending(s => s.SaleDateTime)
            .ToListAsync(ct);

    public async Task<IEnumerable<Sale>> GetTodayByTenantAsync(int tenantId, int? branchId = null, string? branchName = null, CancellationToken ct = default)
    {
        var today = ColombiaTime.Today;      // fecha de hoy en Colombia (GMT-5)
        var tomorrow = today.AddDays(1);
        return await db.Sales
            .Include(s => s.Payments)
            .Where(s => s.TenantId == tenantId && s.SaleDateTime >= today && s.SaleDateTime < tomorrow
                        && (branchId == null || s.BranchId == branchId))
            .OrderByDescending(s => s.SaleDateTime)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<Sale>> GetByTenantAndDateRangeAsync(int tenantId, DateTime from, DateTime to,
        int? branchId = null, string? branchName = null, CancellationToken ct = default) =>
        await db.Sales
            .Include(s => s.Payments)
            .Where(s => s.TenantId == tenantId && s.SaleDateTime >= from && s.SaleDateTime <= to
                        && (branchId == null || s.BranchId == branchId))
            .OrderByDescending(s => s.SaleDateTime)
            .ToListAsync(ct);

    public async Task<IEnumerable<Sale>> GetByStylistAndDateRangeAsync(int tenantId, int stylistId,
        DateTime from, DateTime to, int? branchId = null, string? branchName = null, CancellationToken ct = default) =>
        await db.Sales
            .Include(s => s.Payments)
            .Include(s => s.Items)   // necesario para calcular comisión por ítem en liquidaciones
            .Where(s => s.TenantId == tenantId && s.StylistId == stylistId
                        && s.SaleDateTime >= from && s.SaleDateTime <= to
                        && (branchId == null || s.BranchId == branchId))
            .OrderByDescending(s => s.SaleDateTime)
            .ToListAsync(ct);

    public async Task<IEnumerable<Sale>> GetByCashRegisterAsync(int cashRegisterId, CancellationToken ct = default) =>
        await db.Sales
            .Include(s => s.Payments)
            .Where(s => s.CashRegisterId == cashRegisterId)
            .OrderByDescending(s => s.SaleDateTime)
            .ToListAsync(ct);

    public async Task<Sale?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await db.Sales
            .Include(s => s.Items)
            .Include(s => s.Payments)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<IEnumerable<Sale>> GetByIdsWithPaymentsAsync(IEnumerable<int> ids, CancellationToken ct = default) =>
        await db.Sales
            .Include(s => s.Payments)
            .Include(s => s.Items)
            .Where(s => ids.Contains(s.Id))
            .ToListAsync(ct);

    public async Task AddAsync(Sale sale, CancellationToken ct = default) =>
        await db.Sales.AddAsync(sale, ct);

    public async Task MarkAsSettledAsync(IEnumerable<int> saleIds, CancellationToken ct = default)
    {
        var sales = await db.Sales.Where(s => saleIds.Contains(s.Id)).ToListAsync(ct);
        foreach (var sale in sales) sale.Settle();
    }

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
