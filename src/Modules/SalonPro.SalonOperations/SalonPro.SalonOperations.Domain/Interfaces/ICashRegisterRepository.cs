using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Domain.Interfaces;

public interface ICashRegisterRepository
{
    Task<CashRegister?> GetCurrentOpenByTenantAsync(int tenantId, int branchId, CancellationToken ct = default);
    Task<IEnumerable<CashRegister>> GetAllByTenantAsync(int tenantId, int branchId, CancellationToken ct = default);
    Task<CashRegister?> GetByIdWithDetailsAsync(int id, CancellationToken ct = default);
    Task AddAsync(CashRegister cashRegister, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
