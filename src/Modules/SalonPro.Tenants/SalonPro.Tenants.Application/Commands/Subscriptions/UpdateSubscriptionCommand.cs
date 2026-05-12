using MediatR;
using SalonPro.Shared.Exceptions;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Enums;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Commands.Subscriptions;

public record UpdateSubscriptionCommand(int TenantId, UpdateSubscriptionRequest Request) : IRequest<SubscriptionDto>;

public class UpdateSubscriptionHandler(
    ISubscriptionRepository subscriptionRepo,
    IPlanRepository planRepo) : IRequestHandler<UpdateSubscriptionCommand, SubscriptionDto>
{
    public async Task<SubscriptionDto> Handle(UpdateSubscriptionCommand cmd, CancellationToken ct)
    {
        var subscription = await subscriptionRepo.GetByTenantIdAsync(cmd.TenantId, ct)
            ?? throw new NotFoundException("Subscription", cmd.TenantId);

        var plan = await planRepo.GetByIdAsync(cmd.Request.PlanId, ct)
            ?? throw new NotFoundException("Plan", cmd.Request.PlanId);

        var billingCycle = Enum.Parse<BillingCycle>(cmd.Request.BillingCycle, true);
        subscription.Update(plan.Id, plan.PriceMonthly, plan.PricePerExtra, cmd.Request.ExtraBranches, billingCycle);
        await subscriptionRepo.SaveChangesAsync(ct);

        return new SubscriptionDto(subscription.Id, plan.Id, plan.Name, subscription.ExtraBranches,
            subscription.TotalMonthly, subscription.BillingCycle.ToString(),
            subscription.StartDate, subscription.NextBillingDate, subscription.Status.ToString());
    }
}
