using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.Shared.Common;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Application.Queries.Dashboard;

namespace SalonPro.Tenants.Api.Controllers;

[ApiController]
[Route("api/v1/admin/dashboard")]
[Authorize(Roles = "PlatformAdmin")]
public class DashboardController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<DashboardDto>>> Get(CancellationToken ct)
    {
        var result = await mediator.Send(new GetDashboardQuery(), ct);
        return Ok(ApiResponse<DashboardDto>.Ok(result));
    }
}
