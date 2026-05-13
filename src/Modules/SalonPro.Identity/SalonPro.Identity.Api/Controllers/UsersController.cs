using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.Identity.Application.Commands;
using SalonPro.Identity.Application.DTOs;
using SalonPro.Identity.Application.Queries;
using SalonPro.Shared.Common;

namespace SalonPro.Identity.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public class UsersController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");
    private int GetBranchId() => int.Parse(User.FindFirst("branchId")?.Value ?? "0");

    /// Prefiere el branchId enviado por query param (TenantOwner cambia sede en UI),
    /// si no viene usa el del JWT (Cashier/Stylist tienen sede fija).
    private int? GetEffectiveBranchId(int? requested) =>
        requested.HasValue && requested.Value > 0 ? requested : (GetBranchId() > 0 ? GetBranchId() : null);

    /// <summary>
    /// Returns users for the current tenant, optionally filtered by role and/or branch.
    /// GET /api/v1/users?role=Stylist&amp;branchId=2
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserDto>>>> GetByRole(
        [FromQuery] string? role, [FromQuery] int? branchId, CancellationToken ct)
    {
        var result = await mediator.Send(
            new GetUsersByRoleQuery(GetTenantId(), role ?? string.Empty, GetEffectiveBranchId(branchId)), ct);
        return Ok(ApiResponse<IEnumerable<UserDto>>.Ok(result));
    }

    /// <summary>
    /// Creates a new Cashier or Stylist for the current tenant.
    /// POST /api/v1/users
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "TenantOwner")]
    public async Task<ActionResult<ApiResponse<UserDto>>> Create(
        [FromBody] CreateUserRequest request, CancellationToken ct)
    {
        // Force tenantId from JWT — never trust the body for this
        var tenantId = GetTenantId();

        // Restrict roles that can be created from salon app
        if (request.Role is not ("Cashier" or "Stylist"))
            return BadRequest(ApiResponse<UserDto>.Fail("Solo se pueden crear usuarios con rol Cajero o Estilista."));

        var cmd = new CreateUserCommand(request with { TenantId = tenantId });
        var result = await mediator.Send(cmd, ct);
        return CreatedAtAction(nameof(GetByRole), ApiResponse<UserDto>.Ok(result, "Usuario creado correctamente."));
    }

    /// <summary>
    /// Toggles active/inactive for a user in the current tenant.
    /// PATCH /api/v1/users/{id}/toggle
    /// </summary>
    [HttpPatch("{id:int}/toggle")]
    [Authorize(Roles = "TenantOwner")]
    public async Task<ActionResult<ApiResponse<object>>> Toggle(int id, CancellationToken ct)
    {
        var isActive = await mediator.Send(new ToggleUserStatusCommand(id, GetTenantId()), ct);
        return Ok(ApiResponse<object>.Ok(new { isActive }, isActive ? "Usuario activado." : "Usuario desactivado."));
    }
}
