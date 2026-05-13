using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.Shared.Common;
using SalonPro.Tenants.Application.Commands.Branches;
using SalonPro.Tenants.Application.Commands.Subscriptions;
using SalonPro.Tenants.Application.Commands.Tenants;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Application.Queries.Branches;
using SalonPro.Tenants.Application.Queries.Tenants;

namespace SalonPro.Tenants.Api.Controllers;

[ApiController]
[Route("api/v1/admin/tenants")]
[Authorize(Roles = "PlatformAdmin")]
public class TenantsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<TenantDto>>>> GetAll(
        [FromQuery] string? search, [FromQuery] string? status,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetTenantsQuery(search, status, page, pageSize), ct);
        return Ok(ApiResponse<PagedResult<TenantDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<TenantDto>>> GetById(int id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetTenantByIdQuery(id), ct);
        return Ok(ApiResponse<TenantDto>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CreateTenantResponse>>> Create(
        [FromBody] CreateTenantRequest request, CancellationToken ct)
    {
        var createdBy = User.Identity?.Name ?? "admin";
        var result = await mediator.Send(new CreateTenantCommand(request, createdBy), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Tenant.Id }, ApiResponse<CreateTenantResponse>.Ok(result, "Salón creado exitosamente."));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<TenantDto>>> Update(
        int id, [FromBody] UpdateTenantRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateTenantCommand(id, request), ct);
        return Ok(ApiResponse<TenantDto>.Ok(result));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<ApiResponse>> ChangeStatus(
        int id, [FromBody] ChangeTenantStatusRequest request, CancellationToken ct)
    {
        await mediator.Send(new ChangeTenantStatusCommand(id, request.Status), ct);
        return Ok(ApiResponse.Ok("Estado actualizado."));
    }

    // --- Branches de un tenant ---

    [HttpGet("{tenantId:int}/branches")]
    public async Task<ActionResult<ApiResponse<IEnumerable<BranchDto>>>> GetBranches(
        int tenantId, [FromQuery] bool onlyActive = false, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetBranchesByTenantQuery(tenantId, onlyActive), ct);
        return Ok(ApiResponse<IEnumerable<BranchDto>>.Ok(result));
    }

    [HttpPost("{tenantId:int}/branches")]
    public async Task<ActionResult<ApiResponse<BranchDto>>> CreateBranch(
        int tenantId, [FromBody] CreateBranchRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateBranchCommand(tenantId, request), ct);
        return Created(string.Empty, ApiResponse<BranchDto>.Ok(result, "Sede creada exitosamente."));
    }

    [HttpPut("{tenantId:int}/branches/{branchId:int}")]
    public async Task<ActionResult<ApiResponse<BranchDto>>> UpdateBranch(
        int tenantId, int branchId, [FromBody] UpdateBranchRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateBranchCommand(tenantId, branchId, request), ct);
        return Ok(ApiResponse<BranchDto>.Ok(result));
    }

    // --- Suscripción de un tenant ---

    [HttpPut("{tenantId:int}/subscription")]
    public async Task<ActionResult<ApiResponse<SubscriptionDto>>> UpdateSubscription(
        int tenantId, [FromBody] UpdateSubscriptionRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateSubscriptionCommand(tenantId, request), ct);
        return Ok(ApiResponse<SubscriptionDto>.Ok(result));
    }
}
