using Microsoft.AspNetCore.Http;
using SalonPro.Shared.Interfaces;

namespace SalonPro.Gateway.Middleware;

public class TenantResolutionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ITenantService tenantService)
    {
        // Admin y auth no requieren resolución de tenant
        if (context.Request.Path.StartsWithSegments("/api/v1/admin") ||
            context.Request.Path.StartsWithSegments("/api/v1/auth") ||
            context.Request.Path.StartsWithSegments("/swagger") ||
            context.Request.Path.StartsWithSegments("/health"))
        {
            await next(context);
            return;
        }

        var host = context.Request.Host.Host;
        var slug = ExtractSlug(host);

        if (string.IsNullOrEmpty(slug))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new { success = false, message = "Tenant no identificado." });
            return;
        }

        var tenant = await tenantService.GetBySlugAsync(slug);
        if (tenant is null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            await context.Response.WriteAsJsonAsync(new { success = false, message = "Salon no encontrado." });
            return;
        }

        if (tenant.Status is "Suspended" or "Cancelled")
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { success = false, message = "La cuenta del salón no está activa." });
            return;
        }

        context.Items["TenantId"] = tenant.Id;
        context.Items["TenantSlug"] = tenant.Slug;
        await next(context);
    }

    private static string? ExtractSlug(string host)
    {
        // carlos.salonpro.com.co → "carlos"
        var parts = host.Split('.');
        return parts.Length >= 3 ? parts[0] : null;
    }
}
