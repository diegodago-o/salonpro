using MediatR;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record CloseLiquidacionCommand(int Id, int TenantId) : IRequest;

public class CloseLiquidacionHandler(
    ILiquidacionRepository repo,
    ISaleRepository saleRepo,
    IAnticipoColaboradorRepository anticipoColabRepo)
    : IRequestHandler<CloseLiquidacionCommand>
{
    public async Task Handle(CloseLiquidacionCommand cmd, CancellationToken ct)
    {
        var liquidacion = await repo.GetByIdWithVentasAsync(cmd.Id, ct)
            ?? throw new NotFoundException("Liquidacion", cmd.Id);
        if (liquidacion.TenantId != cmd.TenantId) throw new ForbiddenException();

        liquidacion.Close();

        // Marcar todas las ventas de la liquidación como liquidadas
        // para que no aparezcan en próximas liquidaciones
        var saleIds = liquidacion.Ventas.Select(v => v.SaleId).ToList();
        await saleRepo.MarkAsSettledAsync(saleIds, ct);

        // Marcar los anticipos reservados para esta liquidación como Aplicados
        var anticipos = (await anticipoColabRepo.GetReservadosByLiquidacionAsync(cmd.Id, ct)).ToList();
        foreach (var anticipo in anticipos)
            anticipo.Apply();

        await repo.SaveChangesAsync(ct);
        if (anticipos.Count > 0)
            await anticipoColabRepo.SaveChangesAsync(ct);
    }
}
