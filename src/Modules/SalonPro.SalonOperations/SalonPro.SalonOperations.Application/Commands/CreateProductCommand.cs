using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Commands;

public record CreateProductRequest(
    string Name,
    string Brand,
    string Category,
    decimal PurchasePrice,
    decimal SalePrice,
    int Stock,
    bool IsForSale);

public record CreateProductCommand(int TenantId, int BranchId, CreateProductRequest Request) : IRequest<SalonProductDto>;

public class CreateProductHandler(ISalonProductRepository repo)
    : IRequestHandler<CreateProductCommand, SalonProductDto>
{
    public async Task<SalonProductDto> Handle(CreateProductCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;
        var product = SalonProduct.Create(cmd.TenantId, cmd.BranchId, req.Name, req.Brand, req.Category,
            req.PurchasePrice, req.SalePrice, req.Stock, req.IsForSale);
        await repo.AddAsync(product, ct);
        await repo.SaveChangesAsync(ct);
        return new SalonProductDto(product.Id, product.Name, product.Brand, product.Category,
            product.PurchasePrice, product.SalePrice, product.Stock, product.IsForSale, product.IsActive);
    }
}
