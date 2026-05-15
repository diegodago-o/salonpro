using SalonPro.Identity.Domain.Entities;
using SalonPro.Identity.Domain.Enums;

namespace SalonPro.Identity.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> GetByRefreshTokenAsync(string refreshToken, CancellationToken ct = default);
    Task<IEnumerable<User>> GetByTenantAsync(int tenantId, int? branchId = null, CancellationToken ct = default);
    Task<User?> GetOwnerByTenantAsync(int tenantId, CancellationToken ct = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default);
    Task AddAsync(User user, CancellationToken ct = default);
    Task DeleteByTenantIdAsync(int tenantId, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
