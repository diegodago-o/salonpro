using Microsoft.EntityFrameworkCore;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;

namespace SalonPro.SalonOperations.Infrastructure.Repositories;

public class PaymentMethodRepository(SalonOpsDbContext db) : IPaymentMethodRepository
{
    public async Task<IEnumerable<PaymentMethod>> GetAllByTenantAsync(int tenantId, CancellationToken ct = default, bool onlyActive = true) =>
        await db.PaymentMethods
            .Where(p => p.TenantId == tenantId && (!onlyActive || p.IsActive))
            .OrderBy(p => p.Name)
            .ToListAsync(ct);

    public async Task<PaymentMethod?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await db.PaymentMethods.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task AddAsync(PaymentMethod paymentMethod, CancellationToken ct = default) =>
        await db.PaymentMethods.AddAsync(paymentMethod, ct);

    public async Task AddRangeAsync(IEnumerable<PaymentMethod> methods, CancellationToken ct = default) =>
        await db.PaymentMethods.AddRangeAsync(methods, ct);

    public async Task<bool> HasAnyAsync(int tenantId, CancellationToken ct = default) =>
        await db.PaymentMethods.AnyAsync(p => p.TenantId == tenantId, ct);

    public void Toggle(PaymentMethod method, bool isActive) =>
        method.SetActive(isActive);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
