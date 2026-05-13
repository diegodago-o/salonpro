using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Domain.Interfaces;

public interface IPaymentMethodRepository
{
    Task<IEnumerable<PaymentMethod>> GetAllByTenantAsync(int tenantId, CancellationToken ct = default, bool onlyActive = true);
    Task<PaymentMethod?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(PaymentMethod paymentMethod, CancellationToken ct = default);
    Task AddRangeAsync(IEnumerable<PaymentMethod> methods, CancellationToken ct = default);
    Task<bool> HasAnyAsync(int tenantId, CancellationToken ct = default);
    void Toggle(PaymentMethod method, bool isActive);
    Task SaveChangesAsync(CancellationToken ct = default);
}
