using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    /// <summary>
    /// Returns users for the current tenant, optionally filtered by role.
    /// Usage: GET /api/v1/users?role=Stylist
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserDto>>>> GetByRole(
        [FromQuery] string? role, CancellationToken ct)
    {
        var result = await mediator.Send(new GetUsersByRoleQuery(GetTenantId(), role ?? string.Empty), ct);
        return Ok(ApiResponse<IEnumerable<UserDto>>.Ok(result));
    }
}
