using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.SalonOperations.Application.Commands;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Application.Queries;
using SalonPro.SalonOperations.Domain.Enums;
using SalonPro.Shared.Common;

namespace SalonPro.SalonOperations.Api.Controllers;

[ApiController]
[Route("api/v1/anticipos")]
[Authorize]
public class AnticipasController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");
    private int GetBranchId() => int.Parse(User.FindFirst("branchId")?.Value ?? "0");
    private int? GetEffectiveBranchId(int? requested) =>
        requested.HasValue && requested.Value > 0 ? requested : GetBranchId();

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<AnticipoDto>>>> GetAll(
        [FromQuery] string? status, [FromQuery] int? branchId, CancellationToken ct)
    {
        AnticipoStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<AnticipoStatus>(status, true, out var parsed))
            statusFilter = parsed;

        var result = await mediator.Send(new GetAnticipasQuery(GetTenantId(), GetEffectiveBranchId(branchId), statusFilter), ct);
        return Ok(ApiResponse<IEnumerable<AnticipoDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AnticipoDto>>> Create(
        [FromBody] CreateAnticipoRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateAnticipoCommand(GetTenantId(), GetBranchId(), request), ct);
        return CreatedAtAction(nameof(GetAll), ApiResponse<AnticipoDto>.Ok(result, "Anticipo registrado."));
    }

    [HttpPatch("{id:int}/void")]
    public async Task<ActionResult<ApiResponse<object>>> Void(int id, CancellationToken ct)
    {
        await mediator.Send(new VoidAnticipoCommand(id, GetTenantId()), ct);
        return Ok(ApiResponse.Ok("Anticipo anulado."));
    }
}
