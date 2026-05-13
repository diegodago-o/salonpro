using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using SalonPro.Shared.Common;
using SalonPro.Shared.Exceptions;
using System.Text.Json;

namespace SalonPro.Gateway.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var (statusCode, message) = ex switch
        {
            NotFoundException nfe => (StatusCodes.Status404NotFound, nfe.Message),
            ConflictException ce => (StatusCodes.Status409Conflict, ce.Message),
            ForbiddenException fe => (StatusCodes.Status403Forbidden, fe.Message),
            FluentValidation.ValidationException ve => (StatusCodes.Status400BadRequest, "Datos inválidos."),
            _ => (StatusCodes.Status500InternalServerError, "Error interno del servidor.")
        };

        if (statusCode == 500)
        {
            logger.LogError(ex, "Error no controlado en {Path}", context.Request.Path);
            // DEBUG temporal — exponer detalles del error para diagnóstico
            message = $"[DEBUG] {ex.GetType().Name}: {ex.Message} | {ex.InnerException?.Message}";
        }

        IEnumerable<string> errors = ex is FluentValidation.ValidationException validationEx
            ? validationEx.Errors.Select(e => e.ErrorMessage)
            : [];

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var response = ApiResponse<object>.Fail(message, errors);
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
    }
}
