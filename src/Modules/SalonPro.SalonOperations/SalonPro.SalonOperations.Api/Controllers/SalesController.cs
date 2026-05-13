using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.SalonOperations.Application.Commands;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Application.Queries;
using SalonPro.Shared.Common;

namespace SalonPro.SalonOperations.Api.Controllers;

[ApiController]
[Route("api/v1/sales")]
[Authorize]
public class SalesController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");
    private int? GetCashRegisterId()
    {
        var val = User.FindFirst("cashRegisterId")?.Value;
        return val is null ? null : int.TryParse(val, out var id) ? id : null;
    }
    private int? GetEffectiveBranchId(int? requested)
    {
        if (requested.HasValue && requested.Value > 0) return requested.Value;
        var val = User.FindFirst("branchId")?.Value;
        return val is null ? null : int.TryParse(val, out var id) && id > 0 ? id : null;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<SaleDto>>>> GetSales(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int? branchId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetSalesQuery(GetTenantId(), from, to, GetEffectiveBranchId(branchId)), ct);
        return Ok(ApiResponse<IEnumerable<SaleDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<SaleDto>>> GetDetail(int id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetSaleDetailQuery(GetTenantId(), id), ct);
        return Ok(ApiResponse<SaleDto>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SaleDto>>> Create(
        [FromBody] CreateSaleRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(
            new CreateSaleCommand(GetTenantId(), GetCashRegisterId(), request), ct);
        return CreatedAtAction(nameof(GetSales), ApiResponse<SaleDto>.Ok(result, "Venta registrada."));
    }

    [HttpPatch("{id:int}/void")]
    public async Task<ActionResult<ApiResponse<object>>> Void(
        int id, [FromBody] VoidRequest request, CancellationToken ct)
    {
        await mediator.Send(new VoidSaleCommand(id, GetTenantId(), request), ct);
        return Ok(ApiResponse.Ok("Venta anulada."));
    }
}
