namespace SalonPro.Shared.Interfaces;

public record TenantOwnerInfo(
    int Id,
    string FullName,
    string Email,
    string? Phone,
    string? DocumentType,
    string? DocumentNumber,
    bool IsActive,
    DateTime CreatedAt);

public interface IUserProvisioningService
{
    Task CreateTenantOwnerAsync(
        int tenantId,
        string email,
        string fullName,
        string password,
        string? documentNumber,
        string? tenantName,
        CancellationToken ct);

    Task DeleteTenantUsersAsync(int tenantId, CancellationToken ct);

    Task<TenantOwnerInfo?> GetTenantOwnerAsync(int tenantId, CancellationToken ct);

    Task ResetTenantOwnerPasswordAsync(int tenantId, string newPassword, CancellationToken ct);
}
