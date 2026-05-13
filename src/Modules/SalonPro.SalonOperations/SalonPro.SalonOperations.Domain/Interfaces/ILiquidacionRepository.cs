using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Domain.Interfaces;

public interface ILiquidacionRepository
{
    Task<IEnumerable<Liquidacion>> GetAllByTenantAsync(int tenantId, int? branchId = null, CancellationToken ct = default);
    Task<Liquidacion?> GetByIdWithVentasAsync(int id, CancellationToken ct = default);
    Task AddAsync(Liquidacion liquidacion, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
