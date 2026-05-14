using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.SalonOperations.Application.Commands;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Application.Queries;
using SalonPro.Shared.Common;

namespace SalonPro.SalonOperations.Api.Controllers;

[ApiController]
[Route("api/v1/services")]
[Authorize]
public class ServicesController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");
    private int GetEffectiveBranchId(int? requested = null)
    {
        if (requested.HasValue && requested.Value > 0) return requested.Value;
        return int.Parse(User.FindFirst("branchId")?.Value ?? "0");
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<SalonServiceDto>>>> GetAll(
        [FromQuery] int? branchId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetServicesQuery(GetTenantId(), GetEffectiveBranchId(branchId)), ct);
        return Ok(ApiResponse<IEnumerable<SalonServiceDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SalonServiceDto>>> Create(
        [FromBody] CreateServiceRequest request, [FromQuery] int? branchId, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateServiceCommand(GetTenantId(), GetEffectiveBranchId(branchId), request), ct);
        return CreatedAtAction(nameof(GetAll), ApiResponse<SalonServiceDto>.Ok(result, "Servicio creado."));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<SalonServiceDto>>> Update(
        int id, [FromBody] CreateServiceRequest request, [FromQuery] int? branchId, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateServiceCommand(id, GetTenantId(), GetEffectiveBranchId(branchId), request), ct);
        return Ok(ApiResponse<SalonServiceDto>.Ok(result));
    }

    [HttpPatch("{id:int}/toggle")]
    public async Task<ActionResult<ApiResponse<object>>> Toggle(int id, [FromQuery] int? branchId, CancellationToken ct)
    {
        await mediator.Send(new ToggleServiceCommand(id, GetTenantId(), GetEffectiveBranchId(branchId)), ct);
        return Ok(ApiResponse.Ok("Estado actualizado."));
    }
}
