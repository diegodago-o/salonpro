using Microsoft.EntityFrameworkCore;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;

namespace SalonPro.SalonOperations.Infrastructure.Repositories;

public class SalonServiceRepository(SalonOpsDbContext db) : ISalonServiceRepository
{
    public async Task<IEnumerable<SalonService>> GetAllByTenantAsync(int tenantId, CancellationToken ct = default) =>
        await db.SalonServices
            .Where(s => s.TenantId == tenantId)
            .OrderBy(s => s.Category).ThenBy(s => s.Name)
            .ToListAsync(ct);

    public async Task<SalonService?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await db.SalonServices.FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task AddAsync(SalonService service, CancellationToken ct = default) =>
        await db.SalonServices.AddAsync(service, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
