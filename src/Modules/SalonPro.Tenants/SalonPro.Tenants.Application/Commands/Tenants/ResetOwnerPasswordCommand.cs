using MediatR;
using SalonPro.Shared.Exceptions;
using SalonPro.Shared.Interfaces;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Commands.Tenants;

public record ResetOwnerPasswordCommand(int TenantId, string NewPassword) : IRequest;

public class ResetOwnerPasswordHandler(
    ITenantRepository tenantRepo,
    IUserProvisioningService userProvisioning)
    : IRequestHandler<ResetOwnerPasswordCommand>
{
    public async Task Handle(ResetOwnerPasswordCommand cmd, CancellationToken ct)
    {
        // Verificar que el tenant existe
        var tenant = await tenantRepo.GetByIdAsync(cmd.TenantId, ct)
            ?? throw new NotFoundException("Tenant", cmd.TenantId);

        if (string.IsNullOrWhiteSpace(cmd.NewPassword) || cmd.NewPassword.Length < 6)
            throw new BadRequestException("La contraseña debe tener al menos 6 caracteres.");

        await userProvisioning.ResetTenantOwnerPasswordAsync(cmd.TenantId, cmd.NewPassword, ct);
    }
}
