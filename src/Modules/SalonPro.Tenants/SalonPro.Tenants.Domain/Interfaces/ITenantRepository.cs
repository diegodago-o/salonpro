using SalonPro.Tenants.Domain.Entities;
using SalonPro.Tenants.Domain.Enums;

namespace SalonPro.Tenants.Domain.Interfaces;

public interface ITenantRepository
{
    Task<Tenant?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Tenant?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<Tenant?> GetByNitAsync(string nit, CancellationToken ct = default);
    Task<(IEnumerable<Tenant> Items, int Total)> GetPagedAsync(string? search, TenantStatus? status, int page, int pageSize, CancellationToken ct = default);
    Task<int> CountByStatusAsync(TenantStatus status, CancellationToken ct = default);
    Task<Tenant?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task AddAsync(Tenant tenant, CancellationToken ct = default);
    void Delete(Tenant tenant);
    Task SaveChangesAsync(CancellationToken ct = default);
}
