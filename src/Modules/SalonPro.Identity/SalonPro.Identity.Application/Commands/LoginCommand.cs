using MediatR;
using SalonPro.Identity.Application.DTOs;
using SalonPro.Identity.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.Identity.Application.Commands;

public record LoginCommand(LoginRequest Request) : IRequest<AuthResponse>;

public class LoginHandler(IUserRepository userRepo, IJwtService jwtService, IPasswordHasher hasher)
    : IRequestHandler<LoginCommand, AuthResponse>
{
    public async Task<AuthResponse> Handle(LoginCommand cmd, CancellationToken ct)
    {
        var user = await userRepo.GetByEmailAsync(cmd.Request.Email, ct)
            ?? throw new ForbiddenException("Credenciales inválidas.");

        if (!user.IsActive)
            throw new ForbiddenException("Usuario inactivo.");

        if (!hasher.Verify(cmd.Request.Password, user.PasswordHash))
            throw new ForbiddenException("Credenciales inválidas.");

        var accessToken = jwtService.GenerateAccessToken(user);
        var refreshToken = jwtService.GenerateRefreshToken();
        var expiresAt = DateTime.UtcNow.AddMinutes(jwtService.AccessTokenExpirationMinutes);

        user.SetRefreshToken(refreshToken, DateTime.UtcNow.AddDays(jwtService.RefreshTokenExpirationDays));
        await userRepo.SaveChangesAsync(ct);

        return new AuthResponse(accessToken, refreshToken, expiresAt,
            new UserDto(user.Id, user.FullName, user.Email, user.Role.ToString(),
                user.TenantId, user.BranchId, user.CommissionPercent));
    }
}
