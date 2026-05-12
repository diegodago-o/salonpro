using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.SalonOperations.Application.Commands;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Application.Queries;
using SalonPro.Shared.Common;

namespace SalonPro.SalonOperations.Api.Controllers;

[ApiController]
[Route("api/v1/cash-registers")]
[Authorize]
public class CashRegistersController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");
    private int GetBranchId() => int.Parse(User.FindFirst("branchId")?.Value ?? "0");
    private string GetBranchName() => User.FindFirst("branchName")?.Value ?? "";
    private int GetUserId() => int.Parse(User.FindFirst("sub")?.Value
        ?? User.FindFirst("userId")?.Value ?? "0");
    private string GetUserName() => User.FindFirst("fullName")?.Value
        ?? User.Identity?.Name ?? "Unknown";

    [HttpGet("current")]
    public async Task<ActionResult<ApiResponse<CashRegisterDto?>>> GetCurrent(CancellationToken ct)
    {
        var result = await mediator.Send(new GetCurrentCashRegisterQuery(GetTenantId()), ct);
        return Ok(ApiResponse<CashRegisterDto?>.Ok(result));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<CashRegisterDto>>>> GetHistory(CancellationToken ct)
    {
        var result = await mediator.Send(new GetCashRegisterHistoryQuery(GetTenantId()), ct);
        return Ok(ApiResponse<IEnumerable<CashRegisterDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<CashRegisterDto>>> GetById(int id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetCashRegisterDetailQuery(id), ct);
        return Ok(ApiResponse<CashRegisterDto>.Ok(result));
    }

    [HttpPost("open")]
    public async Task<ActionResult<ApiResponse<CashRegisterDto>>> Open(
        [FromBody] OpenCashRegisterRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(
            new OpenCashRegisterCommand(GetTenantId(), GetBranchId(), GetBranchName(), GetUserId(), GetUserName(), request), ct);
        return CreatedAtAction(nameof(GetCurrent), ApiResponse<CashRegisterDto>.Ok(result, "Caja abierta."));
    }

    [HttpPost("{id:int}/close")]
    public async Task<ActionResult<ApiResponse<CashRegisterDto>>> Close(
        int id, [FromBody] CloseCashRegisterRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new CloseCashRegisterCommand(id, GetTenantId(), request), ct);
        return Ok(ApiResponse<CashRegisterDto>.Ok(result, "Caja cerrada."));
    }
}
