using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Application.Queries;
using SalonPro.Shared.Common;
using SalonPro.Shared.Interfaces;

namespace SalonPro.SalonOperations.Api.Controllers;

[ApiController]
[Route("api/v1/payment-methods")]
[Authorize]
public class PaymentMethodsController(IMediator mediator, IPaymentMethodService paymentMethodService) : ControllerBase
{
    private int GetTenantId() => int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<PaymentMethodDto>>>> GetAll(CancellationToken ct)
    {
        var result = await mediator.Send(new GetPaymentMethodsQuery(GetTenantId()), ct);
        return Ok(ApiResponse<IEnumerable<PaymentMethodDto>>.Ok(result));
    }

    /// <summary>
    /// Seeds the 5 default payment methods for this tenant (idempotent — does nothing if already seeded).
    /// POST /api/v1/payment-methods/seed
    /// </summary>
    [HttpPost("seed")]
    [Authorize(Roles = "TenantOwner")]
    public async Task<ActionResult<ApiResponse>> Seed(CancellationToken ct)
    {
        await paymentMethodService.SeedDefaultMethodsAsync(GetTenantId(), ct);
        return Ok(ApiResponse.Ok("Métodos de pago cargados."));
    }

    /// <summary>
    /// Returns ALL payment methods (active and inactive) for configuration.
    /// GET /api/v1/payment-methods/all
    /// </summary>
    [HttpGet("all")]
    [Authorize(Roles = "TenantOwner")]
    public async Task<ActionResult<ApiResponse<IEnumerable<PaymentMethodDto>>>> GetAllForConfig(CancellationToken ct)
    {
        var result = await mediator.Send(new GetPaymentMethodsQuery(GetTenantId(), includeInactive: true), ct);
        return Ok(ApiResponse<IEnumerable<PaymentMethodDto>>.Ok(result));
    }

    /// <summary>
    /// Toggles active/inactive for a payment method.
    /// PATCH /api/v1/payment-methods/{id}/toggle
    /// </summary>
    [HttpPatch("{id:int}/toggle")]
    [Authorize(Roles = "TenantOwner")]
    public async Task<ActionResult<ApiResponse<PaymentMethodDto>>> Toggle(int id, CancellationToken ct)
    {
        var result = await mediator.Send(new TogglePaymentMethodQuery(GetTenantId(), id), ct);
        return Ok(ApiResponse<PaymentMethodDto>.Ok(result));
    }
}
