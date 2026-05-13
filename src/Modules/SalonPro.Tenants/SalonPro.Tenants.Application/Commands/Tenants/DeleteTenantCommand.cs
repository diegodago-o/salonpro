using MediatR;
using SalonPro.Shared.Exceptions;
using SalonPro.Shared.Interfaces;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Commands.Tenants;

public record DeleteTenantCommand(int TenantId) : IRequest;

public class DeleteTenantHandler(
    ITenantRepository tenantRepo,
    IUserProvisioningService userProvisioning)
    : IRequestHandler<DeleteTenantCommand>
{
    public async Task Handle(DeleteTenantCommand cmd, CancellationToken ct)
    {
        var tenant = await tenantRepo.GetByIdAsync(cmd.TenantId, ct)
            ?? throw new NotFoundException("Tenant", cmd.TenantId);

        // Delete users in the Identity module before removing the tenant
        await userProvisioning.DeleteTenantUsersAsync(cmd.TenantId, ct);

        tenantRepo.Delete(tenant);
        await tenantRepo.SaveChangesAsync(ct);
    }
}
