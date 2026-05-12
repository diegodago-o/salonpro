using MediatR;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record CloseLiquidacionCommand(int Id) : IRequest;

public class CloseLiquidacionHandler(ILiquidacionRepository repo)
    : IRequestHandler<CloseLiquidacionCommand>
{
    public async Task Handle(CloseLiquidacionCommand cmd, CancellationToken ct)
    {
        var liquidacion = await repo.GetByIdWithVentasAsync(cmd.Id, ct)
            ?? throw new NotFoundException("Liquidacion", cmd.Id);
        liquidacion.Close();
        await repo.SaveChangesAsync(ct);
    }
}
