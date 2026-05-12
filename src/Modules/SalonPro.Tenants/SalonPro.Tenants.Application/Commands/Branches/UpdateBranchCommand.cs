using MediatR;
using SalonPro.Shared.Exceptions;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Commands.Branches;

public record UpdateBranchCommand(int TenantId, int BranchId, UpdateBranchRequest Request) : IRequest<BranchDto>;

public class UpdateBranchHandler(IBranchRepository branchRepo) : IRequestHandler<UpdateBranchCommand, BranchDto>
{
    public async Task<BranchDto> Handle(UpdateBranchCommand cmd, CancellationToken ct)
    {
        var branch = await branchRepo.GetByIdAsync(cmd.BranchId, ct)
            ?? throw new NotFoundException("Branch", cmd.BranchId);

        if (branch.TenantId != cmd.TenantId)
            throw new ForbiddenException("La sede no pertenece a este tenant.");

        var req = cmd.Request;
        branch.Update(req.Name, req.Address, req.City, req.Phone);
        await branchRepo.SaveChangesAsync(ct);

        return new BranchDto(branch.Id, branch.TenantId, branch.Name, branch.Address, branch.City, branch.Phone, branch.IsActive, branch.CreatedAt);
    }
}
