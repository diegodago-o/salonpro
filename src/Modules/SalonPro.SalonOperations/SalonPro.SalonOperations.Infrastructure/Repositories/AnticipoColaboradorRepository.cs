using Microsoft.EntityFrameworkCore;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Enums;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;

namespace SalonPro.SalonOperations.Infrastructure.Repositories;

public class AnticipoColaboradorRepository(SalonOpsDbContext db) : IAnticipoColaboradorRepository
{
    public async Task<IEnumerable<AnticipoColaborador>> GetAllByTenantAsync(
        int tenantId, int? branchId = null, int? stylistId = null,
        AnticipoColaboradorStatus? status = null, CancellationToken ct = default) =>
        await db.AnticiposColaborador
            .Where(a => a.TenantId == tenantId
                     && (branchId  == null || a.BranchId  == branchId)
                     && (stylistId == null || a.StylistId == stylistId)
                     && (status    == null || a.Status    == status))
            .OrderByDescending(a => a.Date)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync(ct);

    public async Task<IEnumerable<AnticipoColaborador>> GetLibresPendientesByStylistAsync(
        int tenantId, int stylistId, CancellationToken ct = default) =>
        await db.AnticiposColaborador
            .Where(a => a.TenantId  == tenantId
                     && a.StylistId == stylistId
                     && a.Status    == AnticipoColaboradorStatus.Pendiente
                     && a.LiquidacionId == null)
            .OrderBy(a => a.Date)
            .ToListAsync(ct);

    public async Task<IEnumerable<AnticipoColaborador>> GetReservadosByLiquidacionAsync(
        int liquidacionId, CancellationToken ct = default) =>
        await db.AnticiposColaborador
            .Where(a => a.LiquidacionId == liquidacionId
                     && a.Status        == AnticipoColaboradorStatus.Pendiente)
            .ToListAsync(ct);

    public async Task<AnticipoColaborador?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await db.AnticiposColaborador.FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task AddAsync(AnticipoColaborador anticipo, CancellationToken ct = default) =>
        await db.AnticiposColaborador.AddAsync(anticipo, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
