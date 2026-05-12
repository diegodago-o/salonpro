using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using SalonPro.Shared.Interfaces;

namespace SalonPro.Gateway.Middleware;

public class TenantResolutionMiddleware(RequestDelegate next, IHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context, ITenantService tenantService)
    {
        // Rutas que no requieren resolución de tenant
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

        // En desarrollo sin subdominio (localhost), el tenantId viene del JWT
        // Los controladores ya leen el claim "tenantId" directamente
        if (string.IsNullOrEmpty(slug))
        {
            if (env.IsDevelopment())
            {
                await next(context);
                return;
            }

            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new { success = false, message = "Tenant no identificado." });
            return;
        }

        var tenant = await tenantService.GetBySlugAsync(slug);
        if (tenant is null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            await context.Response.WriteAsJsonAsync(new { success = false, message = "Salón no encontrado." });
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
        // demo.salonpro.com.co → "demo"
        var parts = host.Split('.');
        return parts.Length >= 3 ? parts[0] : null;
    }
}
