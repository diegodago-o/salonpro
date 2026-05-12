using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Domain.Interfaces;

public interface IPaymentMethodRepository
{
    Task<IEnumerable<PaymentMethod>> GetAllByTenantAsync(int tenantId, CancellationToken ct = default);
    Task<PaymentMethod?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(PaymentMethod paymentMethod, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
