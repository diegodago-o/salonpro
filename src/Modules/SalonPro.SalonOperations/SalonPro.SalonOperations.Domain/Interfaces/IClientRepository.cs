using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Domain.Interfaces;

public interface IClientRepository
{
    Task<IEnumerable<Client>> GetAllByTenantAsync(int tenantId, CancellationToken ct = default);
    Task<Client?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Client?> GetByDocumentAsync(int tenantId, string documentNumber, CancellationToken ct = default);
    Task AddAsync(Client client, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
