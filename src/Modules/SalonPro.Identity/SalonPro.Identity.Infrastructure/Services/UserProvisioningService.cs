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

    public async Task<TenantOwnerInfo?> GetTenantOwnerAsync(int tenantId, CancellationToken ct)
    {
        var user = await userRepo.GetOwnerByTenantAsync(tenantId, ct);
        if (user is null) return null;
        return new TenantOwnerInfo(
            user.Id, user.FullName, user.Email,
            user.Phone, user.DocumentType, user.DocumentNumber,
            user.IsActive, user.CreatedAt);
    }

    public async Task ResetTenantOwnerPasswordAsync(int tenantId, string newPassword, CancellationToken ct)
    {
        var user = await userRepo.GetOwnerByTenantAsync(tenantId, ct)
            ?? throw new KeyNotFoundException($"No se encontró administrador para el tenant {tenantId}.");
        var newHash = hasher.Hash(newPassword);
        user.ChangePassword(newHash);
        await userRepo.SaveChangesAsync(ct);
    }
}
