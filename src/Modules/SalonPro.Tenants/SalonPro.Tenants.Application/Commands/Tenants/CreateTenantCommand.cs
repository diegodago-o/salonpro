using MediatR;
using SalonPro.Shared.Exceptions;
using SalonPro.Shared.Interfaces;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Entities;
using SalonPro.Tenants.Domain.Enums;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Commands.Tenants;

public record CreateTenantCommand(CreateTenantRequest Request, string CreatedBy) : IRequest<CreateTenantResponse>;

public class CreateTenantHandler(
    ITenantRepository tenantRepo,
    IPlanRepository planRepo,
    ISubscriptionRepository subscriptionRepo,
    IBranchRepository branchRepo,
    IUserProvisioningService userProvisioning) : IRequestHandler<CreateTenantCommand, CreateTenantResponse>
{
    public async Task<CreateTenantResponse> Handle(CreateTenantCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;

        if (await tenantRepo.GetBySlugAsync(req.Slug, ct) is not null)
            throw new ConflictException($"El subdominio '{req.Slug}' ya está en uso.");

        if (await tenantRepo.GetByNitAsync(req.Nit, ct) is not null)
            throw new ConflictException($"El NIT '{req.Nit}' ya está registrado.");

        var plan = await planRepo.GetByIdAsync(req.PlanId, ct)
            ?? throw new NotFoundException(nameof(Plan), req.PlanId);

        var tenant = Tenant.Create(req.BusinessName, req.TradeName, req.Nit, req.Slug,
            req.Email, req.Phone, req.Address, req.City, cmd.CreatedBy);

        await tenantRepo.AddAsync(tenant, ct);
        await tenantRepo.SaveChangesAsync(ct);

        var billingCycle = Enum.Parse<BillingCycle>(req.BillingCycle, true);
        var subscription = Subscription.Create(tenant.Id, plan.Id, plan.PriceMonthly,
            plan.PricePerExtra, req.ExtraBranches, billingCycle);

        await subscriptionRepo.AddAsync(subscription, ct);

        var branch = Branch.Create(tenant.Id, req.BranchName, req.BranchAddress, req.BranchCity, req.BranchPhone);
        await branchRepo.AddAsync(branch, ct);
        await subscriptionRepo.SaveChangesAsync(ct);

        // Crear usuario dueño del salón
        await userProvisioning.CreateTenantOwnerAsync(
            tenant.Id, req.OwnerEmail, req.OwnerFullName,
            req.OwnerPassword, req.OwnerDocument, tenant.BusinessName, ct);

        var tenantDto = new TenantDto(tenant.Id, tenant.BusinessName, tenant.TradeName, tenant.Nit,
            tenant.Slug, tenant.Email, tenant.Phone, tenant.Address, tenant.City, tenant.LogoUrl,
            tenant.Status.ToString(), tenant.TrialEndsAt, tenant.CreatedAt, null, 1);

        return new CreateTenantResponse(tenantDto, req.OwnerEmail, req.OwnerPassword);
    }
}
