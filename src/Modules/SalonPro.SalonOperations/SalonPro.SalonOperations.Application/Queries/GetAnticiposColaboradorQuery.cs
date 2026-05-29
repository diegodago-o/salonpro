using MediatR;
using SalonPro.SalonOperations.Application.Commands;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Enums;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetAnticiposColaboradorQuery(
    int TenantId,
    int? BranchId  = null,
    int? StylistId = null,
    AnticipoColaboradorStatus? Status = null) : IRequest<IEnumerable<AnticipoColaboradorDto>>;

public class GetAnticiposColaboradorHandler(IAnticipoColaboradorRepository repo)
    : IRequestHandler<GetAnticiposColaboradorQuery, IEnumerable<AnticipoColaboradorDto>>
{
    public async Task<IEnumerable<AnticipoColaboradorDto>> Handle(
        GetAnticiposColaboradorQuery query, CancellationToken ct)
    {
        var items = await repo.GetAllByTenantAsync(
            query.TenantId, query.BranchId, query.StylistId, query.Status, ct);

        return items.Select(CreateAnticipoColaboradorHandler.ToDto);
    }
}
