using MediatR;
using SalonPro.SalonOperations.Domain.Enums;
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

        // Marcar ventas: Settled si no hay hermanos pendientes en el mismo ticket,
        // PartiallySettled si el ticket multi-colaborador tiene otros aún activos.
        var saleIds = liquidacion.Ventas.Select(v => v.SaleId).ToList();
        var sales = await saleRepo.GetByIdsWithPaymentsAsync(saleIds, ct);

        foreach (var sale in sales)
        {
            if (sale.TicketId == null)
            {
                // Venta de colaborador único — liquidada completamente
                sale.Settle();
            }
            else
            {
                var siblings = (await saleRepo.GetByTicketIdAsync(sale.TicketId.Value, ct))
                    .Where(s => s.Id != sale.Id)
                    .ToList();

                var allSiblingsDone = siblings.All(s =>
                    s.Status == SaleStatus.Settled ||
                    s.Status == SaleStatus.PartiallySettled ||
                    s.Status == SaleStatus.Voided);

                if (allSiblingsDone)
                {
                    sale.Settle();
                    // Subir hermanos parcialmente liquidados a Settled
                    foreach (var s in siblings.Where(s => s.Status == SaleStatus.PartiallySettled))
                        s.Settle();
                }
                else
                {
                    sale.PartiallySettle();
                }
            }
        }

        // Marcar los anticipos reservados para esta liquidación como Aplicados
        var anticipos = (await anticipoColabRepo.GetReservadosByLiquidacionAsync(cmd.Id, ct)).ToList();
        foreach (var anticipo in anticipos)
            anticipo.Apply();

        await repo.SaveChangesAsync(ct);
        if (anticipos.Count > 0)
            await anticipoColabRepo.SaveChangesAsync(ct);
    }
}
