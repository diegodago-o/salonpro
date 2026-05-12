using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.SalonOperations.Application.Commands;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Application.Queries;
using SalonPro.Shared.Common;

namespace SalonPro.SalonOperations.Api.Controllers;

[ApiController]
[Route("api/v1/liquidaciones")]
[Authorize]
public class LiquidacionesController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<LiquidacionResumenDto>>>> GetAll(CancellationToken ct)
    {
        var result = await mediator.Send(new GetLiquidacionesQuery(GetTenantId()), ct);
        return Ok(ApiResponse<IEnumerable<LiquidacionResumenDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<LiquidacionDetalleDto>>> GetById(int id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetLiquidacionDetalleQuery(id), ct);
        return Ok(ApiResponse<LiquidacionDetalleDto>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<LiquidacionResumenDto>>> Create(
        [FromBody] CreateLiquidacionRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateLiquidacionCommand(GetTenantId(), request), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<LiquidacionResumenDto>.Ok(result, "Liquidación creada."));
    }

    [HttpPatch("{id:int}/close")]
    public async Task<ActionResult<ApiResponse<object>>> Close(int id, CancellationToken ct)
    {
        await mediator.Send(new CloseLiquidacionCommand(id, GetTenantId()), ct);
        return Ok(ApiResponse.Ok("Liquidación cerrada."));
    }
}
