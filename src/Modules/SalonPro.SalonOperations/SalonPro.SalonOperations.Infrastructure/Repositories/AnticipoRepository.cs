using Microsoft.EntityFrameworkCore;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Enums;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;

namespace SalonPro.SalonOperations.Infrastructure.Repositories;

public class AnticipoRepository(SalonOpsDbContext db) : IAnticipoRepository
{
    public async Task<IEnumerable<Anticipo>> GetAllByTenantAsync(int tenantId, AnticipoStatus? status = null,
        CancellationToken ct = default)
    {
        var query = db.Anticipos.Where(a => a.TenantId == tenantId);
        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);
        return await query.OrderByDescending(a => a.CreatedAt).ToListAsync(ct);
    }

    public async Task<Anticipo?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await db.Anticipos.FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task AddAsync(Anticipo anticipo, CancellationToken ct = default) =>
        await db.Anticipos.AddAsync(anticipo, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
