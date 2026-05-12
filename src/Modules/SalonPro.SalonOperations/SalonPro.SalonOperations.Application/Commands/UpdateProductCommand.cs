using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record UpdateProductCommand(int Id, CreateProductRequest Request) : IRequest<SalonProductDto>;

public class UpdateProductHandler(ISalonProductRepository repo)
    : IRequestHandler<UpdateProductCommand, SalonProductDto>
{
    public async Task<SalonProductDto> Handle(UpdateProductCommand cmd, CancellationToken ct)
    {
        var product = await repo.GetByIdAsync(cmd.Id, ct)
            ?? throw new NotFoundException("SalonProduct", cmd.Id);
        var req = cmd.Request;
        product.Update(req.Name, req.Brand, req.Category, req.PurchasePrice, req.SalePrice, req.IsForSale);
        await repo.SaveChangesAsync(ct);
        return new SalonProductDto(product.Id, product.Name, product.Brand, product.Category,
            product.PurchasePrice, product.SalePrice, product.Stock, product.IsForSale, product.IsActive);
    }
}
