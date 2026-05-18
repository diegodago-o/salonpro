using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SalonPro.Shared.Common;
using SalonPro.Shared.Exceptions;
using SalonPro.Tenants.Application.Commands.Tenants;
using SalonPro.Tenants.Application.DTOs;
using SalonPro.Tenants.Application.Queries.Tenants;

namespace SalonPro.Tenants.Api.Controllers;

/// <summary>
/// Permite al TenantOwner consultar y actualizar los datos de su propio salón.
/// No requiere rol PlatformAdmin.
/// </summary>
[ApiController]
[Route("api/v1/tenants/profile")]
[Authorize]
public class TenantProfileController(IMediator mediator) : ControllerBase
{
    private int GetTenantId() =>
        int.Parse(User.FindFirst("tenantId")?.Value ?? "0");

    /// <summary>GET /api/v1/tenants/profile — datos del salón propio</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<TenantDto>>> Get(CancellationToken ct)
    {
        var result = await mediator.Send(new GetTenantByIdQuery(GetTenantId()), ct);
        return Ok(ApiResponse<TenantDto>.Ok(result));
    }

    /// <summary>PUT /api/v1/tenants/profile — actualizar datos del salón propio</summary>
    [HttpPut]
    [Authorize(Roles = "TenantOwner")]
    public async Task<ActionResult<ApiResponse<TenantDto>>> Update(
        [FromBody] UpdateTenantRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateTenantCommand(GetTenantId(), request), ct);
        return Ok(ApiResponse<TenantDto>.Ok(result, "Información del salón actualizada."));
    }

    /// <summary>POST /api/v1/tenants/profile/logo — subir logo del salón</summary>
    [HttpPost("logo")]
    [Authorize(Roles = "TenantOwner")]
    [RequestSizeLimit(5 * 1024 * 1024)]   // 5 MB máx.
    public async Task<ActionResult<ApiResponse<object>>> UploadLogo(
        IFormFile file,
        [FromServices] IWebHostEnvironment env,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            throw new BadRequestException("No se recibió ningún archivo.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!new[] { ".jpg", ".jpeg", ".png", ".webp" }.Contains(ext))
            throw new BadRequestException("Formato no válido. Usa JPG, PNG o WebP.");

        if (file.Length > 2 * 1024 * 1024)
            throw new BadRequestException("El archivo supera los 2 MB.");

        // Guardar en wwwroot/uploads/logos/
        var rootPath = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var folder   = Path.Combine(rootPath, "uploads", "logos");
        Directory.CreateDirectory(folder);

        var fileName = $"tenant_{GetTenantId()}{ext}";
        var filePath = Path.Combine(folder, fileName);

        await using var stream = System.IO.File.Create(filePath);
        await file.CopyToAsync(stream, ct);

        // Se devuelve ruta relativa para que el cliente construya la URL
        // con su propio esquema (evita mixed-content http/https detrás de proxy).
        var logoUrl = $"/uploads/logos/{fileName}";
        return Ok(ApiResponse<object>.Ok(new { logoUrl }, "Logo subido correctamente."));
    }
}
