using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SalonPro.Identity.Domain.Entities;
using SalonPro.Identity.Domain.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SalonPro.Identity.Infrastructure.Services;

public class JwtService(IConfiguration config) : IJwtService
{
    public int AccessTokenExpirationMinutes =>
        int.TryParse(config["Jwt:ExpirationMinutes"], out var m) ? m : 60;

    public int RefreshTokenExpirationDays => 7;

    public string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("fullName", user.FullName),
        };

        if (user.TenantId.HasValue)
            claims.Add(new Claim("tenantId", user.TenantId.Value.ToString()));

        if (user.BranchId.HasValue)
            claims.Add(new Claim("branchId", user.BranchId.Value.ToString()));

        if (!string.IsNullOrEmpty(user.BranchName))
            claims.Add(new Claim("branchName", user.BranchName));

        if (!string.IsNullOrEmpty(user.TenantName))
            claims.Add(new Claim("tenantName", user.TenantName));

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(AccessTokenExpirationMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }
}
