using MediatR;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record VoidRequest(string Reason);

public record VoidSaleCommand(int Id, int TenantId, VoidRequest Request) : IRequest;

public class VoidSaleHandler(ISaleRepository repo)
    : IRequestHandler<VoidSaleCommand>
{
    public async Task Handle(VoidSaleCommand cmd, CancellationToken ct)
    {
        var sale = await repo.GetByIdAsync(cmd.Id, ct)
            ?? throw new NotFoundException("Sale", cmd.Id);
        if (sale.TenantId != cmd.TenantId) throw new ForbiddenException();
        sale.Void(cmd.Request.Reason);
        await repo.SaveChangesAsync(ct);
    }
}
