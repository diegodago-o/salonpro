using Microsoft.EntityFrameworkCore;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Enums;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;

namespace SalonPro.SalonOperations.Infrastructure.Repositories;

public class CashRegisterRepository(SalonOpsDbContext db) : ICashRegisterRepository
{
    public async Task<CashRegister?> GetCurrentOpenByTenantAsync(int tenantId, CancellationToken ct = default) =>
        await db.CashRegisters
            .Include(c => c.Details)
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Status == CashRegisterStatus.Open, ct);

    public async Task<IEnumerable<CashRegister>> GetAllByTenantAsync(int tenantId, CancellationToken ct = default) =>
        await db.CashRegisters
            .Include(c => c.Details)
            .Where(c => c.TenantId == tenantId)
            .OrderByDescending(c => c.OpenedAt)
            .ToListAsync(ct);

    public async Task<CashRegister?> GetByIdWithDetailsAsync(int id, CancellationToken ct = default) =>
        await db.CashRegisters
            .Include(c => c.Details)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AddAsync(CashRegister cashRegister, CancellationToken ct = default) =>
        await db.CashRegisters.AddAsync(cashRegister, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
