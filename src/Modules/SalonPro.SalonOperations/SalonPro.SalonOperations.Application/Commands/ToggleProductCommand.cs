using MediatR;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record ToggleActiveRequest(bool IsActive);

public record ToggleProductCommand(int Id, bool IsActive) : IRequest;

public class ToggleProductHandler(ISalonProductRepository repo)
    : IRequestHandler<ToggleProductCommand>
{
    public async Task Handle(ToggleProductCommand cmd, CancellationToken ct)
    {
        var product = await repo.GetByIdAsync(cmd.Id, ct)
            ?? throw new NotFoundException("SalonProduct", cmd.Id);
        product.SetActive(cmd.IsActive);
        await repo.SaveChangesAsync(ct);
    }
}
