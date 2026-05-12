using MediatR;
using SalonPro.Shared.Exceptions;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Commands.Tenants;

public record UpdateTenantCommand(int TenantId, UpdateTenantRequest Request) : IRequest<TenantDto>;

public class UpdateTenantHandler(ITenantRepository tenantRepo, IBranchRepository branchRepo)
    : IRequestHandler<UpdateTenantCommand, TenantDto>
{
    public async Task<TenantDto> Handle(UpdateTenantCommand cmd, CancellationToken ct)
    {
        var tenant = await tenantRepo.GetByIdAsync(cmd.TenantId, ct)
            ?? throw new NotFoundException("Tenant", cmd.TenantId);

        var req = cmd.Request;
        tenant.Update(req.BusinessName, req.TradeName, req.Phone, req.Address, req.City, req.LogoUrl);

        await tenantRepo.SaveChangesAsync(ct);

        var branchCount = await branchRepo.CountByTenantAsync(tenant.Id, ct);

        return new TenantDto(tenant.Id, tenant.BusinessName, tenant.TradeName, tenant.Nit,
            tenant.Slug, tenant.Email, tenant.Phone, tenant.Address, tenant.City, tenant.LogoUrl,
            tenant.Status.ToString(), tenant.TrialEndsAt, tenant.CreatedAt, null, branchCount);
    }
}
