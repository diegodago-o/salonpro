namespace SalonPro.Shared.Interfaces;

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
}
