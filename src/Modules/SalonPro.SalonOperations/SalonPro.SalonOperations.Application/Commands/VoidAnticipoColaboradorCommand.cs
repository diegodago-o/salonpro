using MediatR;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record VoidAnticipoColaboradorCommand(int Id, int TenantId) : IRequest;

public class VoidAnticipoColaboradorHandler(IAnticipoColaboradorRepository repo)
    : IRequestHandler<VoidAnticipoColaboradorCommand>
{
    public async Task Handle(VoidAnticipoColaboradorCommand cmd, CancellationToken ct)
    {
        var anticipo = await repo.GetByIdAsync(cmd.Id, ct)
            ?? throw new NotFoundException("AnticipoColaborador", cmd.Id);

        if (anticipo.TenantId != cmd.TenantId) throw new ForbiddenException();

        anticipo.Void();
        await repo.SaveChangesAsync(ct);
    }
}
