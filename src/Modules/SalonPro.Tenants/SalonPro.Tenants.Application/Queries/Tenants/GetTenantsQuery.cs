using MediatR;
using SalonPro.Shared.Common;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Enums;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Queries.Tenants;

public record GetTenantsQuery(string? Search, string? Status, int Page, int PageSize) : IRequest<PagedResult<TenantDto>>;

public class GetTenantsHandler(ITenantRepository tenantRepo, IBranchRepository branchRepo)
    : IRequestHandler<GetTenantsQuery, PagedResult<TenantDto>>
{
    public async Task<PagedResult<TenantDto>> Handle(GetTenantsQuery query, CancellationToken ct)
    {
        TenantStatus? status = query.Status is not null
            ? Enum.Parse<TenantStatus>(query.Status, true)
            : null;

        var (items, total) = await tenantRepo.GetPagedAsync(query.Search, status, query.Page, query.PageSize, ct);

        var dtos = new List<TenantDto>();
        foreach (var t in items)
        {
            var branchCount = await branchRepo.CountByTenantAsync(t.Id, ct);
            dtos.Add(new TenantDto(t.Id, t.BusinessName, t.TradeName, t.Nit, t.Slug, t.Email,
                t.Phone, t.Address, t.City, t.LogoUrl, t.Status.ToString(), t.TrialEndsAt, t.CreatedAt, null, branchCount));
        }

        return PagedResult<TenantDto>.Create(dtos, total, query.Page, query.PageSize);
    }
}
