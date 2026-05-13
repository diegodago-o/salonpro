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
        ("Tarjeta débito",    true,  7m),   // ← descuento bancario igual que crédito
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
        // Upsert: crea los que faltan y sincroniza la configuración de los existentes
        var existing = (await repo.GetAllByTenantAsync(tenantId, ct, onlyActive: false))
            .ToDictionary(m => m.Name.Trim(), StringComparer.OrdinalIgnoreCase);

        foreach (var d in Defaults)
        {
            if (existing.TryGetValue(d.Name, out var method))
                method.Update(d.Name, d.HasDeduction, d.DeductionPercent); // actualiza % si cambió
            else
                await repo.AddAsync(PaymentMethod.Create(tenantId, d.Name, d.HasDeduction, d.DeductionPercent), ct);
        }

        await repo.SaveChangesAsync(ct);
    }
}
