using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetLiquidacionDetalleQuery(int Id, int TenantId) : IRequest<LiquidacionDetalleDto>;

public class GetLiquidacionDetalleHandler(ILiquidacionRepository repo)
    : IRequestHandler<GetLiquidacionDetalleQuery, LiquidacionDetalleDto>
{
    public async Task<LiquidacionDetalleDto> Handle(GetLiquidacionDetalleQuery query, CancellationToken ct)
    {
        var l = await repo.GetByIdWithVentasAsync(query.Id, ct)
            ?? throw new NotFoundException("Liquidacion", query.Id);
        if (l.TenantId != query.TenantId) throw new ForbiddenException();

        var ventas = l.Ventas.Select(v => new LiquidacionVentaDto(
            v.SaleId, v.SaleDateTime.ToString("o"), v.ClientName,
            v.GrossServices, v.GrossProducts, v.Deduction,
            v.CommServices, v.CommProducts, v.Tip, v.InternalConsumption
        )).ToList();

        return new LiquidacionDetalleDto(
            l.Id, l.StylistId, l.StylistName,
            l.StartDate.ToString("yyyy-MM-dd"), l.EndDate.ToString("yyyy-MM-dd"),
            l.TotalVentas, l.GrossServices, l.GrossProducts, l.TotalDeductions,
            l.CommServices, l.CommProducts, l.TotalTips, l.InternalConsumption,
            l.AnticiposAplicados, l.NetoPeluquero, l.Status.ToString(),
            ventas);
    }
}
