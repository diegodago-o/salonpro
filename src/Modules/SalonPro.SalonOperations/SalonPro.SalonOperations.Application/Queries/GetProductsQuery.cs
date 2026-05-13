using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetProductsQuery(int TenantId, int BranchId) : IRequest<IEnumerable<SalonProductDto>>;

public class GetProductsHandler(ISalonProductRepository repo)
    : IRequestHandler<GetProductsQuery, IEnumerable<SalonProductDto>>
{
    public async Task<IEnumerable<SalonProductDto>> Handle(GetProductsQuery query, CancellationToken ct)
    {
        var products = await repo.GetAllByBranchAsync(query.TenantId, query.BranchId, ct);
        return products.Select(p => new SalonProductDto(
            p.Id, p.Name, p.Brand, p.Category, p.PurchasePrice, p.SalePrice,
            p.StylistCommissionPercent, p.Stock, p.IsForSale, p.IsActive));
    }
}
