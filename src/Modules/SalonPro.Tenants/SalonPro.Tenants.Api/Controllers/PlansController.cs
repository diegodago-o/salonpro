using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.Shared.Common;
using SalonPro.Tenants.Application.Commands.Plans;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Application.Queries.Plans;

namespace SalonPro.Tenants.Api.Controllers;

[ApiController]
[Route("api/v1/admin/plans")]
[Authorize(Roles = "PlatformAdmin")]
public class PlansController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<PlanDto>>>> GetAll(
        [FromQuery] bool onlyActive = false, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetPlansQuery(onlyActive), ct);
        return Ok(ApiResponse<IEnumerable<PlanDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<PlanDto>>> GetById(int id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetPlanByIdQuery(id), ct);
        return Ok(ApiResponse<PlanDto>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PlanDto>>> Create(
        [FromBody] CreatePlanRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new CreatePlanCommand(request), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<PlanDto>.Ok(result, "Plan creado."));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<PlanDto>>> Update(
        int id, [FromBody] UpdatePlanRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdatePlanCommand(id, request), ct);
        return Ok(ApiResponse<PlanDto>.Ok(result));
    }

    [HttpPatch("{id:int}/toggle")]
    public async Task<ActionResult<ApiResponse<PlanDto>>> Toggle(int id, CancellationToken ct)
    {
        var result = await mediator.Send(new TogglePlanCommand(id), ct);
        var msg = result.IsActive ? "Plan activado." : "Plan desactivado.";
        return Ok(ApiResponse<PlanDto>.Ok(result, msg));
    }
}
