using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.SalonOperations.Application.Commands;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.Shared.Common;

namespace SalonPro.SalonOperations.Api.Controllers;

[ApiController]
[Route("api/v1/tickets")]
[Authorize]
public class TicketsController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");
    private int? GetCashRegisterId()
    {
        var val = User.FindFirst("cashRegisterId")?.Value;
        return val is null ? null : int.TryParse(val, out var id) ? id : null;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<TicketDto>>> Create(
        [FromBody] CreateTicketRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(
            new CreateTicketCommand(GetTenantId(), GetCashRegisterId(), request), ct);
        return CreatedAtAction(nameof(Create), ApiResponse<TicketDto>.Ok(result, "Venta registrada."));
    }
}
