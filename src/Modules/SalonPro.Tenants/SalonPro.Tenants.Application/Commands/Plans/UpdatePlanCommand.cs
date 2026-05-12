using MediatR;
using SalonPro.Shared.Exceptions;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Commands.Plans;

public record UpdatePlanCommand(int PlanId, UpdatePlanRequest Request) : IRequest<PlanDto>;

public class UpdatePlanHandler(IPlanRepository planRepo) : IRequestHandler<UpdatePlanCommand, PlanDto>
{
    public async Task<PlanDto> Handle(UpdatePlanCommand cmd, CancellationToken ct)
    {
        var plan = await planRepo.GetByIdAsync(cmd.PlanId, ct)
            ?? throw new NotFoundException("Plan", cmd.PlanId);

        var req = cmd.Request;
        plan.Update(req.Name, req.MaxBranches, req.PriceMonthly, req.PricePerExtra, req.Features);
        await planRepo.SaveChangesAsync(ct);

        return new PlanDto(plan.Id, plan.Name, plan.MaxBranches, plan.PriceMonthly, plan.PricePerExtra, plan.Features, plan.IsActive);
    }
}
