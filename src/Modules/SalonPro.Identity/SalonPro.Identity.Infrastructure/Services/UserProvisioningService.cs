using SalonPro.Identity.Domain.Entities;
using SalonPro.Identity.Domain.Enums;
using SalonPro.Identity.Domain.Interfaces;
using SalonPro.Shared.Interfaces;

namespace SalonPro.Identity.Infrastructure.Services;

public class UserProvisioningService(IUserRepository userRepo, IPasswordHasher hasher)
    : IUserProvisioningService
{
    public async Task CreateTenantOwnerAsync(
        int tenantId,
        string email,
        string fullName,
        string password,
        string? documentNumber,
        string? tenantName,
        CancellationToken ct)
    {
        if (await userRepo.ExistsByEmailAsync(email, ct))
            return; // idempotente — no duplicar si ya existe

        var hash = hasher.Hash(password);
        var user = User.Create(fullName, email, hash, UserRole.TenantOwner,
            tenantId: tenantId,
            documentNumber: documentNumber,
            tenantName: tenantName);

        await userRepo.AddAsync(user, ct);
        await userRepo.SaveChangesAsync(ct);
    }

    public async Task DeleteTenantUsersAsync(int tenantId, CancellationToken ct)
    {
        await userRepo.DeleteByTenantIdAsync(tenantId, ct);
        await userRepo.SaveChangesAsync(ct);
    }
}
