using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Application.Queries;
using SalonPro.Shared.Common;

namespace SalonPro.SalonOperations.Api.Controllers;

[ApiController]
[Route("api/v1/payment-methods")]
[Authorize]
public class PaymentMethodsController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<PaymentMethodDto>>>> GetAll(CancellationToken ct)
    {
        var result = await mediator.Send(new GetPaymentMethodsQuery(GetTenantId()), ct);
        return Ok(ApiResponse<IEnumerable<PaymentMethodDto>>.Ok(result));
    }
}
