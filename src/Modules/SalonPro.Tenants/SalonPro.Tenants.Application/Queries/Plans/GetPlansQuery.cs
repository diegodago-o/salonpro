using MediatR;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Queries.Plans;

public record GetPlansQuery(bool OnlyActive = false) : IRequest<IEnumerable<PlanDto>>;

public class GetPlansHandler(IPlanRepository planRepo) : IRequestHandler<GetPlansQuery, IEnumerable<PlanDto>>
{
    public async Task<IEnumerable<PlanDto>> Handle(GetPlansQuery query, CancellationToken ct)
    {
        var plans = await planRepo.GetAllAsync(query.OnlyActive, ct);
        return plans.Select(p => new PlanDto(p.Id, p.Name, p.MaxBranches, p.PriceMonthly, p.PricePerExtra, p.Features, p.IsActive));
    }
}
