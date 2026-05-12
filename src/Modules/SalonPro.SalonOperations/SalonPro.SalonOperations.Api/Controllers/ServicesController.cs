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

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<SalonServiceDto>>>> GetAll(CancellationToken ct)
    {
        var result = await mediator.Send(new GetServicesQuery(GetTenantId()), ct);
        return Ok(ApiResponse<IEnumerable<SalonServiceDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<SalonServiceDto>>> Create(
        [FromBody] CreateServiceRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateServiceCommand(GetTenantId(), request), ct);
        return CreatedAtAction(nameof(GetAll), ApiResponse<SalonServiceDto>.Ok(result, "Servicio creado."));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<SalonServiceDto>>> Update(
        int id, [FromBody] CreateServiceRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateServiceCommand(id, request), ct);
        return Ok(ApiResponse<SalonServiceDto>.Ok(result));
    }

    [HttpPatch("{id:int}/toggle")]
    public async Task<ActionResult<ApiResponse<object>>> Toggle(int id, CancellationToken ct)
    {
        await mediator.Send(new ToggleServiceCommand(id), ct);
        return Ok(ApiResponse.Ok("Estado actualizado."));
    }
}
