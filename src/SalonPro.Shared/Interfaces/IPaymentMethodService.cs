namespace SalonPro.Shared.Interfaces;

public interface IPaymentMethodService
{
    Task<PaymentMethodInfo?> GetByIdAsync(int paymentMethodId, CancellationToken ct = default);
    Task<decimal> GetDeductionPercentAsync(int paymentMethodId, CancellationToken ct = default);
    Task SeedDefaultMethodsAsync(int tenantId, CancellationToken ct = default);
}

public record PaymentMethodInfo(int Id, int TenantId, string Name, bool HasDeduction, decimal DeductionPercent);
