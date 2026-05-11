using MediatR;
using SalonPro.Shared.Exceptions;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Entities;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Commands.Branches;

public record CreateBranchCommand(int TenantId, CreateBranchRequest Request) : IRequest<BranchDto>;

public class CreateBranchHandler(
    ITenantRepository tenantRepo,
    IBranchRepository branchRepo,
    ISubscriptionRepository subscriptionRepo) : IRequestHandler<CreateBranchCommand, BranchDto>
{
    public async Task<BranchDto> Handle(CreateBranchCommand cmd, CancellationToken ct)
    {
        var tenant = await tenantRepo.GetByIdAsync(cmd.TenantId, ct)
            ?? throw new NotFoundException("Tenant", cmd.TenantId);

        var subscription = await subscriptionRepo.GetByTenantIdAsync(cmd.TenantId, ct)
            ?? throw new NotFoundException("Subscription", cmd.TenantId);

        var currentBranches = await branchRepo.CountByTenantAsync(cmd.TenantId, ct);
        var maxAllowed = subscription.Plan.MaxBranches + subscription.ExtraBranches;

        if (currentBranches >= maxAllowed)
            throw new ConflictException($"El plan permite máximo {maxAllowed} sedes. Contrate sedes extra o actualice el plan.");

        var req = cmd.Request;
        var branch = Branch.Create(cmd.TenantId, req.Name, req.Address, req.City, req.Phone);
        await branchRepo.AddAsync(branch, ct);
        await branchRepo.SaveChangesAsync(ct);

        return new BranchDto(branch.Id, branch.TenantId, branch.Name, branch.Address, branch.City, branch.Phone, branch.IsActive, branch.CreatedAt);
    }
}
