using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.SalonOperations.Application.Commands;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Application.Queries;
using SalonPro.Shared.Common;

namespace SalonPro.SalonOperations.Api.Controllers;

[ApiController]
[Route("api/v1/clients")]
[Authorize]
public class ClientsController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ClientDto>>>> GetAll(CancellationToken ct)
    {
        var result = await mediator.Send(new GetClientsQuery(GetTenantId()), ct);
        return Ok(ApiResponse<IEnumerable<ClientDto>>.Ok(result));
    }

    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<ClientDto?>>> SearchByDocument(
        [FromQuery] string document, CancellationToken ct)
    {
        var result = await mediator.Send(new SearchClientByDocumentQuery(GetTenantId(), document), ct);
        return Ok(ApiResponse<ClientDto?>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ClientDto>>> Create(
        [FromBody] CreateClientRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateClientCommand(GetTenantId(), request), ct);
        return CreatedAtAction(nameof(GetAll), ApiResponse<ClientDto>.Ok(result, "Cliente creado."));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<ClientDto>>> Update(
        int id, [FromBody] CreateClientRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateClientCommand(id, request), ct);
        return Ok(ApiResponse<ClientDto>.Ok(result));
    }
}
