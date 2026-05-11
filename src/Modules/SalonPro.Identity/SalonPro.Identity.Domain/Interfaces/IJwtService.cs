using SalonPro.Identity.Domain.Entities;

namespace SalonPro.Identity.Domain.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    int AccessTokenExpirationMinutes { get; }
    int RefreshTokenExpirationDays { get; }
}
