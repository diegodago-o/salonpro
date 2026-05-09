using MediatR;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Entities;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Commands.Plans;

public record CreatePlanCommand(CreatePlanRequest Request) : IRequest<PlanDto>;

public class CreatePlanHandler(IPlanRepository planRepo) : IRequestHandler<CreatePlanCommand, PlanDto>
{
    public async Task<PlanDto> Handle(CreatePlanCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;
        var plan = Plan.Create(req.Name, req.MaxBranches, req.PriceMonthly, req.PricePerExtra, req.Features);
        await planRepo.AddAsync(plan, ct);
        await planRepo.SaveChangesAsync(ct);
        return new PlanDto(plan.Id, plan.Name, plan.MaxBranches, plan.PriceMonthly, plan.PricePerExtra, plan.Features, plan.IsActive);
    }
}
