using Microsoft.EntityFrameworkCore;
using SalonPro.Identity.Domain.Entities;
using SalonPro.Identity.Domain.Interfaces;
using SalonPro.Identity.Infrastructure.Data;

namespace SalonPro.Identity.Infrastructure.Repositories;

public class UserRepository(IdentityDbContext db) : IUserRepository
{
    public async Task<User?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await db.Users.FindAsync([id], ct);

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        await db.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower().Trim(), ct);

    public async Task<User?> GetByRefreshTokenAsync(string refreshToken, CancellationToken ct = default) =>
        await db.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken, ct);

    public async Task<IEnumerable<User>> GetByTenantAsync(int tenantId, CancellationToken ct = default) =>
        await db.Users.Where(u => u.TenantId == tenantId).OrderBy(u => u.FullName).ToListAsync(ct);

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken ct = default) =>
        await db.Users.AnyAsync(u => u.Email == email.ToLower().Trim(), ct);

    public async Task AddAsync(User user, CancellationToken ct = default) =>
        await db.Users.AddAsync(user, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);
}
