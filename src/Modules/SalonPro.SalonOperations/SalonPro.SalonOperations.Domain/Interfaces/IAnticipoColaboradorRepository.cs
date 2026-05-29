using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Enums;

namespace SalonPro.SalonOperations.Domain.Interfaces;

public interface IAnticipoColaboradorRepository
{
    /// <summary>Lista todos los anticipos del tenant con filtros opcionales.</summary>
    Task<IEnumerable<AnticipoColaborador>> GetAllByTenantAsync(
        int tenantId,
        int? branchId   = null,
        int? stylistId  = null,
        AnticipoColaboradorStatus? status = null,
        CancellationToken ct = default);

    /// <summary>
    /// Anticipos Pendientes y sin reserva (LiquidacionId == null) para un estilista.
    /// Usado por CreateLiquidacionCommand para incluirlos en el cálculo.
    /// </summary>
    Task<IEnumerable<AnticipoColaborador>> GetLibresPendientesByStylistAsync(
        int tenantId, int stylistId, CancellationToken ct = default);

    /// <summary>
    /// Anticipos reservados para una liquidación concreta (LiquidacionId == id, Status == Pendiente).
    /// Usado por CloseLiquidacionCommand para marcarlos como Aplicado.
    /// </summary>
    Task<IEnumerable<AnticipoColaborador>> GetReservadosByLiquidacionAsync(
        int liquidacionId, CancellationToken ct = default);

    Task<AnticipoColaborador?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(AnticipoColaborador anticipo, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
