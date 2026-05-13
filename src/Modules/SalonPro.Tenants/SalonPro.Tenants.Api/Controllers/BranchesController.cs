using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.Shared.Common;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Application.Queries.Branches;

namespace SalonPro.Tenants.Api.Controllers;

/// <summary>
/// Salon-facing endpoint: returns branches for the authenticated user's tenant.
/// Accessible to any authenticated salon user (TenantOwner, Cashier, Stylist).
/// </summary>
[ApiController]
[Route("api/v1/branches")]
[Authorize]
public class BranchesController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<BranchDto>>>> GetMyBranches(
        [FromQuery] bool onlyActive = true, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetBranchesByTenantQuery(GetTenantId(), onlyActive), ct);
        return Ok(ApiResponse<IEnumerable<BranchDto>>.Ok(result));
    }
}
