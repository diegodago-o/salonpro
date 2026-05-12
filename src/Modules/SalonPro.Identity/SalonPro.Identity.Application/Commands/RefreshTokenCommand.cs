using MediatR;
using SalonPro.Identity.Application.DTOs;
using SalonPro.Identity.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.Identity.Application.Commands;

public record RefreshTokenCommand(RefreshTokenRequest Request) : IRequest<AuthResponse>;

public class RefreshTokenHandler(IUserRepository userRepo, IJwtService jwtService)
    : IRequestHandler<RefreshTokenCommand, AuthResponse>
{
    public async Task<AuthResponse> Handle(RefreshTokenCommand cmd, CancellationToken ct)
    {
        var user = await userRepo.GetByRefreshTokenAsync(cmd.Request.RefreshToken, ct)
            ?? throw new ForbiddenException("Refresh token inválido o expirado.");

        if (!user.IsRefreshTokenValid(cmd.Request.RefreshToken))
            throw new ForbiddenException("Refresh token inválido o expirado.");

        var accessToken = jwtService.GenerateAccessToken(user);
        var newRefreshToken = jwtService.GenerateRefreshToken();
        var expiresIn = jwtService.AccessTokenExpirationMinutes * 60;

        user.SetRefreshToken(newRefreshToken, DateTime.UtcNow.AddDays(jwtService.RefreshTokenExpirationDays));
        await userRepo.SaveChangesAsync(ct);

        return new AuthResponse(accessToken, newRefreshToken, expiresIn,
            new UserDto(user.Id, user.FullName, user.Email, user.Role.ToString(),
                user.TenantId, user.BranchId, user.CommissionPercent,
                user.BranchName, user.TenantName));
    }
}
