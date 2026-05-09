using MediatR;
using SalonPro.Shared.Exceptions;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Commands.Plans;

public record TogglePlanCommand(int PlanId) : IRequest<PlanDto>;

public class TogglePlanHandler(IPlanRepository planRepo) : IRequestHandler<TogglePlanCommand, PlanDto>
{
    public async Task<PlanDto> Handle(TogglePlanCommand cmd, CancellationToken ct)
    {
        var plan = await planRepo.GetByIdAsync(cmd.PlanId, ct)
            ?? throw new NotFoundException("Plan", cmd.PlanId);

        plan.SetActive(!plan.IsActive);
        await planRepo.SaveChangesAsync(ct);

        return new PlanDto(plan.Id, plan.Name, plan.MaxBranches, plan.PriceMonthly,
            plan.PricePerExtra, plan.Features, plan.IsActive);
    }
}
