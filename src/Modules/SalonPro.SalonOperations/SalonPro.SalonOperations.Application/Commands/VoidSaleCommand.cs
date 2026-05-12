using MediatR;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record VoidRequest(string Reason);

public record VoidSaleCommand(int Id, VoidRequest Request) : IRequest;

public class VoidSaleHandler(ISaleRepository repo)
    : IRequestHandler<VoidSaleCommand>
{
    public async Task Handle(VoidSaleCommand cmd, CancellationToken ct)
    {
        var sale = await repo.GetByIdAsync(cmd.Id, ct)
            ?? throw new NotFoundException("Sale", cmd.Id);
        sale.Void(cmd.Request.Reason);
        await repo.SaveChangesAsync(ct);
    }
}
