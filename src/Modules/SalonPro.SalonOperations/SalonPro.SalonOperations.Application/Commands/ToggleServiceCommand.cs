using MediatR;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record ToggleServiceCommand(int Id) : IRequest;

public class ToggleServiceHandler(ISalonServiceRepository repo)
    : IRequestHandler<ToggleServiceCommand>
{
    public async Task Handle(ToggleServiceCommand cmd, CancellationToken ct)
    {
        var service = await repo.GetByIdAsync(cmd.Id, ct)
            ?? throw new NotFoundException("SalonService", cmd.Id);
        service.SetActive(!service.IsActive);
        await repo.SaveChangesAsync(ct);
    }
}
