using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.SalonOperations.Application.Commands;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Application.Queries;
using SalonPro.Shared.Common;

namespace SalonPro.SalonOperations.Api.Controllers;

[ApiController]
[Route("api/v1/products")]
[Authorize]
public class ProductsController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<SalonProductDto>>>> GetAll(CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductsQuery(GetTenantId()), ct);
        return Ok(ApiResponse<IEnumerable<SalonProductDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SalonProductDto>>> Create(
        [FromBody] CreateProductRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateProductCommand(GetTenantId(), request), ct);
        return CreatedAtAction(nameof(GetAll), ApiResponse<SalonProductDto>.Ok(result, "Producto creado."));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<SalonProductDto>>> Update(
        int id, [FromBody] CreateProductRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateProductCommand(id, request), ct);
        return Ok(ApiResponse<SalonProductDto>.Ok(result));
    }

    [HttpPatch("{id:int}/stock")]
    public async Task<ActionResult<ApiResponse<object>>> AdjustStock(
        int id, [FromBody] AdjustStockRequest request, CancellationToken ct)
    {
        await mediator.Send(new AdjustStockCommand(id, request), ct);
        return Ok(ApiResponse.Ok("Stock actualizado."));
    }

    [HttpPatch("{id:int}/toggle")]
    public async Task<ActionResult<ApiResponse<object>>> ToggleActive(
        int id, [FromBody] ToggleActiveRequest request, CancellationToken ct)
    {
        await mediator.Send(new ToggleProductCommand(id, request.IsActive), ct);
        return Ok(ApiResponse.Ok("Estado actualizado."));
    }
}
