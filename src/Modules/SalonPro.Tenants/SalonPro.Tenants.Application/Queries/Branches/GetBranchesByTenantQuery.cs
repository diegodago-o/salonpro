using MediatR;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Queries.Branches;

public record GetBranchesByTenantQuery(int TenantId, bool OnlyActive = false) : IRequest<IEnumerable<BranchDto>>;

public class GetBranchesByTenantHandler(IBranchRepository branchRepo)
    : IRequestHandler<GetBranchesByTenantQuery, IEnumerable<BranchDto>>
{
    public async Task<IEnumerable<BranchDto>> Handle(GetBranchesByTenantQuery query, CancellationToken ct)
    {
        var branches = await branchRepo.GetByTenantAsync(query.TenantId, query.OnlyActive, ct);
        return branches.Select(b => new BranchDto(b.Id, b.TenantId, b.Name, b.Address, b.City, b.Phone, b.IsActive, b.CreatedAt));
    }
}
