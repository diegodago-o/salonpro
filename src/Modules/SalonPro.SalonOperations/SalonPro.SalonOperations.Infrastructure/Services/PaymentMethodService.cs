using Microsoft.EntityFrameworkCore;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;
using SalonPro.Shared.Interfaces;

namespace SalonPro.SalonOperations.Infrastructure.Services;

public class PaymentMethodService(IPaymentMethodRepository repo) : IPaymentMethodService
{
    private static readonly (string Name, bool HasDeduction, decimal DeductionPercent)[] Defaults =
    [
        ("Efectivo",          false, 0m),
        ("Tarjeta débito",    false, 0m),
        ("Tarjeta crédito",   true,  7m),
        ("Transferencia",     false, 0m),
        ("Nequi / Daviplata", false, 0m),
    ];

    public async Task<PaymentMethodInfo?> GetByIdAsync(int paymentMethodId, CancellationToken ct = default)
    {
        var pm = await repo.GetByIdAsync(paymentMethodId, ct);
        return pm is null ? null : new PaymentMethodInfo(pm.Id, pm.TenantId, pm.Name, pm.HasDeduction, pm.DeductionPercent);
    }

    public async Task<decimal> GetDeductionPercentAsync(int paymentMethodId, CancellationToken ct = default)
    {
        var pm = await repo.GetByIdAsync(paymentMethodId, ct);
        return pm?.DeductionPercent ?? 0m;
    }

    public async Task SeedDefaultMethodsAsync(int tenantId, CancellationToken ct = default)
    {
        if (await repo.HasAnyAsync(tenantId, ct)) return; // idempotente

        var methods = Defaults.Select(d =>
            PaymentMethod.Create(tenantId, d.Name, d.HasDeduction, d.DeductionPercent));

        await repo.AddRangeAsync(methods, ct);
        await repo.SaveChangesAsync(ct);
    }
}
