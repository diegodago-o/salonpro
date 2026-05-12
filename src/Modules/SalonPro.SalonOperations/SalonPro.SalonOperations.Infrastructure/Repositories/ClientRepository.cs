using Microsoft.EntityFrameworkCore;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;

namespace SalonPro.SalonOperations.Infrastructure.Repositories;

public class ClientRepository(SalonOpsDbContext db) : IClientRepository
{
    public async Task<IEnumerable<Client>> GetAllByTenantAsync(int tenantId, CancellationToken ct = default) =>
        await db.Clients
            .Where(c => c.TenantId == tenantId)
            .OrderBy(c => c.FullName)
            .ToListAsync(ct);

    public async Task<Client?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await db.Clients.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<Client?> GetByDocumentAsync(int tenantId, string documentNumber, CancellationToken ct = default) =>
        await db.Clients.FirstOrDefaultAsync(c => c.TenantId == tenantId && c.DocumentNumber == documentNumber, ct);

    public async Task AddAsync(Client client, CancellationToken ct = default) =>
        await db.Clients.AddAsync(client, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
