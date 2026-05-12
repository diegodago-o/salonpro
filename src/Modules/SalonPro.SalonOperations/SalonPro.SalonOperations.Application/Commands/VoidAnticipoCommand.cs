using MediatR;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record VoidAnticipoCommand(int Id, int TenantId) : IRequest;

public class VoidAnticipoHandler(IAnticipoRepository repo)
    : IRequestHandler<VoidAnticipoCommand>
{
    public async Task Handle(VoidAnticipoCommand cmd, CancellationToken ct)
    {
        var anticipo = await repo.GetByIdAsync(cmd.Id, ct)
            ?? throw new NotFoundException("Anticipo", cmd.Id);
        if (anticipo.TenantId != cmd.TenantId) throw new ForbiddenException();
        anticipo.Void();
        await repo.SaveChangesAsync(ct);
    }
}
