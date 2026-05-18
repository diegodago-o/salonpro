using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.Shared.Common;
using SalonPro.Tenants.Application.Commands.Tenants;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Application.Queries.Tenants;

namespace SalonPro.Tenants.Api.Controllers;

/// <summary>
/// Permite al TenantOwner consultar y actualizar los datos de su propio salón.
/// No requiere rol PlatformAdmin.
/// </summary>
[ApiController]
[Route("api/v1/tenants/profile")]
[Authorize]
public class TenantProfileController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() =>
        int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    /// <summary>GET /api/v1/tenants/profile — datos del salón propio</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<TenantDto>>> Get(CancellationToken ct)
    {
        var result = await mediator.Send(new GetTenantByIdQuery(GetTenantId()), ct);
        return Ok(ApiResponse<TenantDto>.Ok(result));
    }

    /// <summary>PUT /api/v1/tenants/profile — actualizar datos del salón propio</summary>
    [HttpPut]
    [Authorize(Roles = "TenantOwner")]
    public async Task<ActionResult<ApiResponse<TenantDto>>> Update(
        [FromBody] UpdateTenantRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateTenantCommand(GetTenantId(), request), ct);
        return Ok(ApiResponse<TenantDto>.Ok(result, "Información del salón actualizada."));
    }
}
