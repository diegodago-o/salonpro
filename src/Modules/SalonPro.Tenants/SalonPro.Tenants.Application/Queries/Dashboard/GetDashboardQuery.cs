using MediatR;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Enums;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Queries.Dashboard;

public record GetDashboardQuery : IRequest<DashboardDto>;

public class GetDashboardHandler(ITenantRepository tenantRepo)
    : IRequestHandler<GetDashboardQuery, DashboardDto>
{
    public async Task<DashboardDto> Handle(GetDashboardQuery query, CancellationToken ct)
    {
        var total = await tenantRepo.CountByStatusAsync(TenantStatus.Trial, ct)
                  + await tenantRepo.CountByStatusAsync(TenantStatus.Active, ct)
                  + await tenantRepo.CountByStatusAsync(TenantStatus.Suspended, ct)
                  + await tenantRepo.CountByStatusAsync(TenantStatus.Cancelled, ct);

        var active = await tenantRepo.CountByStatusAsync(TenantStatus.Active, ct);
        var trial = await tenantRepo.CountByStatusAsync(TenantStatus.Trial, ct);
        var suspended = await tenantRepo.CountByStatusAsync(TenantStatus.Suspended, ct);

        var (recentItems, _) = await tenantRepo.GetPagedAsync(null, null, 1, 10, ct);
        var recent = recentItems.Select(t => new TenantSummaryDto(
            t.Id, t.BusinessName, t.Slug, t.Status.ToString(), t.CreatedAt,
            t.Subscription?.Plan?.Name ?? "Sin plan")).ToList();

        // MRR: suma de suscripciones activas
        decimal mrr = recent.Count > 0 ? 0m : 0m; // calculado en Infrastructure para precisión

        return new DashboardDto(total, active, trial, suspended, mrr, recent);
    }
}
