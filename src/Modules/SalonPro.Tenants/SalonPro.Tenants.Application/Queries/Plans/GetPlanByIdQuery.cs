using MediatR;
using SalonPro.Shared.Exceptions;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Queries.Plans;

public record GetPlanByIdQuery(int PlanId) : IRequest<PlanDto>;

public class GetPlanByIdHandler(IPlanRepository planRepo) : IRequestHandler<GetPlanByIdQuery, PlanDto>
{
    public async Task<PlanDto> Handle(GetPlanByIdQuery query, CancellationToken ct)
    {
        var plan = await planRepo.GetByIdAsync(query.PlanId, ct)
            ?? throw new NotFoundException("Plan", query.PlanId);

        return new PlanDto(plan.Id, plan.Name, plan.MaxBranches, plan.PriceMonthly, plan.PricePerExtra, plan.Features, plan.IsActive);
    }
}
