using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonPro.Identity.Application.Commands;
using SalonPro.Identity.Application.DTOs;
using SalonPro.Shared.Common;
using System.Security.Claims;

namespace SalonPro.Identity.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(IMediator mediator) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login(
        [FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new LoginCommand(request), ct);
        return Ok(ApiResponse<AuthResponse>.Ok(result));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Refresh(
        [FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new RefreshTokenCommand(request), ct);
        return Ok(ApiResponse<AuthResponse>.Ok(result));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> Logout(CancellationToken ct)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub") ?? "0");
        await mediator.Send(new LogoutCommand(userId), ct);
        return Ok(ApiResponse.Ok("Sesión cerrada."));
    }

    [HttpPost("users")]
    [Authorize(Roles = "PlatformAdmin,TenantOwner")]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateUser(
        [FromBody] CreateUserRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateUserCommand(request), ct);
        return Created(string.Empty, ApiResponse<UserDto>.Ok(result, "Usuario creado."));
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<ApiResponse<object>> Me()
    {
        var claims = User.Claims.Select(c => new { c.Type, c.Value });
        return Ok(ApiResponse<object>.Ok(claims));
    }
}
