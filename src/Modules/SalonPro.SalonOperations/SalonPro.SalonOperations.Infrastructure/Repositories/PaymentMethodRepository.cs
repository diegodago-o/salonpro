using Microsoft.EntityFrameworkCore;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;

namespace SalonPro.SalonOperations.Infrastructure.Repositories;

public class PaymentMethodRepository(SalonOpsDbContext db) : IPaymentMethodRepository
{
    public async Task<IEnumerable<PaymentMethod>> GetAllByTenantAsync(int tenantId, CancellationToken ct = default) =>
        await db.PaymentMethods
            .Where(p => p.TenantId == tenantId && p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync(ct);

    public async Task<PaymentMethod?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await db.PaymentMethods.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task AddAsync(PaymentMethod paymentMethod, CancellationToken ct = default) =>
        await db.PaymentMethods.AddAsync(paymentMethod, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
