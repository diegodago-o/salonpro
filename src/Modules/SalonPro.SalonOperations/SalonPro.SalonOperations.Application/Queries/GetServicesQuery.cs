using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetServicesQuery(int TenantId) : IRequest<IEnumerable<SalonServiceDto>>;

public class GetServicesHandler(ISalonServiceRepository repo)
    : IRequestHandler<GetServicesQuery, IEnumerable<SalonServiceDto>>
{
    public async Task<IEnumerable<SalonServiceDto>> Handle(GetServicesQuery query, CancellationToken ct)
    {
        var services = await repo.GetAllByTenantAsync(query.TenantId, ct);
        return services.Select(s => new SalonServiceDto(
            s.Id, s.Name, s.Category, s.Price, s.HasSalonFee, s.SalonFeePercent, s.IsActive));
    }
}
