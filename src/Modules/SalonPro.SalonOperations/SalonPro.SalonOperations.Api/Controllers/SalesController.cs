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

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<SaleDto>>>> GetToday(CancellationToken ct)
    {
        var result = await mediator.Send(new GetSalesQuery(GetTenantId()), ct);
        return Ok(ApiResponse<IEnumerable<SaleDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SaleDto>>> Create(
        [FromBody] CreateSaleRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(
            new CreateSaleCommand(GetTenantId(), GetCashRegisterId(), request), ct);
        return CreatedAtAction(nameof(GetToday), ApiResponse<SaleDto>.Ok(result, "Venta registrada."));
    }

    [HttpPatch("{id:int}/void")]
    public async Task<ActionResult<ApiResponse<object>>> Void(
        int id, [FromBody] VoidRequest request, CancellationToken ct)
    {
        await mediator.Send(new VoidSaleCommand(id, request), ct);
        return Ok(ApiResponse.Ok("Venta anulada."));
    }
}
