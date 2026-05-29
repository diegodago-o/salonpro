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
[Route("api/v1/anticipos-colaborador")]
[Authorize]
public class AnticiposColaboradorController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");
    private int GetBranchId() => int.Parse(User.FindFirst("branchId")?.Value ?? "0");

    /// <summary>
    /// Igual que LiquidacionesController: usa el branchId enviado por el frontend (sede seleccionada),
    /// cae al JWT solo si no viene, y devuelve null cuando el JWT tiene 0 (TenantOwner sin sede fija).
    /// Esto evita guardar BranchId=0 y el posterior mismatch en el filtro del GET.
    /// </summary>
    private int? GetEffectiveBranchId(int? requested)
    {
        if (requested.HasValue && requested.Value > 0) return requested;
        var fromJwt = GetBranchId();
        return fromJwt > 0 ? fromJwt : null;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<AnticipoColaboradorDto>>>> GetAll(
        [FromQuery] int? stylistId,
        [FromQuery] string? status,
        [FromQuery] int? branchId,
        CancellationToken ct)
    {
        AnticipoColaboradorStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<AnticipoColaboradorStatus>(status, true, out var parsed))
            statusFilter = parsed;

        var result = await mediator.Send(
            new GetAnticiposColaboradorQuery(
                GetTenantId(), GetEffectiveBranchId(branchId), stylistId, statusFilter), ct);

        return Ok(ApiResponse<IEnumerable<AnticipoColaboradorDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AnticipoColaboradorDto>>> Create(
        [FromBody] CreateAnticipoColaboradorRequest request,
        [FromQuery] int? branchId,          // la sede seleccionada en el frontend
        CancellationToken ct)
    {
        var result = await mediator.Send(
            new CreateAnticipoColaboradorCommand(GetTenantId(), GetEffectiveBranchId(branchId), request), ct);

        return CreatedAtAction(nameof(GetAll), ApiResponse<AnticipoColaboradorDto>.Ok(result, "Anticipo registrado."));
    }

    [HttpPatch("{id:int}/void")]
    public async Task<ActionResult<ApiResponse<object>>> Void(int id, CancellationToken ct)
    {
        await mediator.Send(new VoidAnticipoColaboradorCommand(id, GetTenantId()), ct);
        return Ok(ApiResponse.Ok("Anticipo anulado."));
    }
}
