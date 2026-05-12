using MediatR;
using SalonPro.Shared.Exceptions;
using SalonPro.Tenants.Domain.Enums;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Commands.Tenants;

public record ChangeTenantStatusCommand(int TenantId, string NewStatus) : IRequest;

public class ChangeTenantStatusHandler(ITenantRepository tenantRepo)
    : IRequestHandler<ChangeTenantStatusCommand>
{
    public async Task Handle(ChangeTenantStatusCommand cmd, CancellationToken ct)
    {
        var tenant = await tenantRepo.GetByIdAsync(cmd.TenantId, ct)
            ?? throw new NotFoundException("Tenant", cmd.TenantId);

        if (!Enum.TryParse<TenantStatus>(cmd.NewStatus, true, out var newStatus))
            throw new ArgumentException($"Estado inválido: {cmd.NewStatus}");

        tenant.ChangeStatus(newStatus);
        await tenantRepo.SaveChangesAsync(ct);
    }
}
