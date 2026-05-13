using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetLiquidacionesQuery(int TenantId, int? BranchId = null) : IRequest<IEnumerable<LiquidacionResumenDto>>;

public class GetLiquidacionesHandler(ILiquidacionRepository repo)
    : IRequestHandler<GetLiquidacionesQuery, IEnumerable<LiquidacionResumenDto>>
{
    public async Task<IEnumerable<LiquidacionResumenDto>> Handle(GetLiquidacionesQuery query, CancellationToken ct)
    {
        var liquidaciones = await repo.GetAllByTenantAsync(query.TenantId, query.BranchId, ct);
        return liquidaciones.Select(l => new LiquidacionResumenDto(
            l.Id, l.StylistId, l.StylistName,
            l.StartDate.ToString("yyyy-MM-dd"), l.EndDate.ToString("yyyy-MM-dd"),
            l.TotalVentas, l.GrossServices, l.GrossProducts, l.TotalDeductions,
            l.CommServices, l.CommProducts, l.TotalTips, l.InternalConsumption,
            l.AnticiposAplicados, l.NetoPeluquero, l.Status.ToString()));
    }
}
