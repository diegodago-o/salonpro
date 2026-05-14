using MediatR;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record AdjustStockRequest(int Stock);

public record AdjustStockCommand(int Id, int TenantId, int BranchId, AdjustStockRequest Request) : IRequest;

public class AdjustStockHandler(ISalonProductRepository repo)
    : IRequestHandler<AdjustStockCommand>
{
    public async Task Handle(AdjustStockCommand cmd, CancellationToken ct)
    {
        var product = await repo.GetByIdAsync(cmd.Id, ct)
            ?? throw new NotFoundException("SalonProduct", cmd.Id);
        if (product.TenantId != cmd.TenantId) throw new ForbiddenException();
        if (product.BranchId != cmd.BranchId) throw new ForbiddenException();
        product.AdjustStock(cmd.Request.Stock);
        await repo.SaveChangesAsync(ct);
    }
}
