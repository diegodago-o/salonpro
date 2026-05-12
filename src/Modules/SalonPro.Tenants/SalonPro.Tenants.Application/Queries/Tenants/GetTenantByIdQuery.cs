using MediatR;
using SalonPro.Shared.Exceptions;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Queries.Tenants;

public record GetTenantByIdQuery(int TenantId) : IRequest<TenantDto>;

public class GetTenantByIdHandler(ITenantRepository tenantRepo, IBranchRepository branchRepo, ISubscriptionRepository subscriptionRepo)
    : IRequestHandler<GetTenantByIdQuery, TenantDto>
{
    public async Task<TenantDto> Handle(GetTenantByIdQuery query, CancellationToken ct)
    {
        var tenant = await tenantRepo.GetByIdAsync(query.TenantId, ct)
            ?? throw new NotFoundException("Tenant", query.TenantId);

        var subscription = await subscriptionRepo.GetByTenantIdAsync(tenant.Id, ct);
        var branchCount = await branchRepo.CountByTenantAsync(tenant.Id, ct);

        SubscriptionDto? subDto = subscription is not null
            ? new SubscriptionDto(subscription.Id, subscription.PlanId,
                subscription.Plan?.Name ?? string.Empty,
                subscription.ExtraBranches, subscription.TotalMonthly,
                subscription.BillingCycle.ToString(), subscription.StartDate,
                subscription.NextBillingDate, subscription.Status.ToString())
            : null;

        return new TenantDto(tenant.Id, tenant.BusinessName, tenant.TradeName, tenant.Nit,
            tenant.Slug, tenant.Email, tenant.Phone, tenant.Address, tenant.City, tenant.LogoUrl,
            tenant.Status.ToString(), tenant.TrialEndsAt, tenant.CreatedAt, subDto, branchCount);
    }
}
