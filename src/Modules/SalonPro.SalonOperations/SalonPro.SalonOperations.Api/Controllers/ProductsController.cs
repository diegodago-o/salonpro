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
    private int GetEffectiveBranchId(int? requested = null)
    {
        if (requested.HasValue && requested.Value > 0) return requested.Value;
        return int.Parse(User.FindFirst("branchId")?.Value ?? "0");
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<SalonProductDto>>>> GetAll(
        [FromQuery] int? branchId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductsQuery(GetTenantId(), GetEffectiveBranchId(branchId)), ct);
        return Ok(ApiResponse<IEnumerable<SalonProductDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SalonProductDto>>> Create(
        [FromBody] CreateProductRequest request, [FromQuery] int? branchId, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateProductCommand(GetTenantId(), GetEffectiveBranchId(branchId), request), ct);
        return CreatedAtAction(nameof(GetAll), ApiResponse<SalonProductDto>.Ok(result, "Producto creado."));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<SalonProductDto>>> Update(
        int id, [FromBody] CreateProductRequest request, [FromQuery] int? branchId, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateProductCommand(id, GetTenantId(), GetEffectiveBranchId(branchId), request), ct);
        return Ok(ApiResponse<SalonProductDto>.Ok(result));
    }

    [HttpPatch("{id:int}/stock")]
    public async Task<ActionResult<ApiResponse<object>>> AdjustStock(
        int id, [FromBody] AdjustStockRequest request, [FromQuery] int? branchId, CancellationToken ct)
    {
        await mediator.Send(new AdjustStockCommand(id, GetTenantId(), GetEffectiveBranchId(branchId), request), ct);
        return Ok(ApiResponse.Ok("Stock actualizado."));
    }

    [HttpPatch("{id:int}/toggle")]
    public async Task<ActionResult<ApiResponse<object>>> ToggleActive(
        int id, [FromBody] ToggleActiveRequest request, [FromQuery] int? branchId, CancellationToken ct)
    {
        await mediator.Send(new ToggleProductCommand(id, GetTenantId(), GetEffectiveBranchId(branchId), request.IsActive), ct);
        return Ok(ApiResponse.Ok("Estado actualizado."));
    }
}
