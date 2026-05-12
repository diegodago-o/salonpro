namespace SalonPro.Identity.Application.DTOs;

public record LoginRequest(string Email, string Password);

public record RefreshTokenRequest(string RefreshToken);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,   // segundos
    UserDto User
);

public record UserDto(
    int Id,
    string FullName,
    string Email,
    string Role,
    int? TenantId,
    int? BranchId,
    decimal CommissionPercent,
    string? BranchName,
    string? TenantName
);

public record CreateUserRequest(
    string FullName,
    string Email,
    string Password,
    string Role,
    int? TenantId,
    int? BranchId,
    string? DocumentType,
    string? DocumentNumber,
    string? Phone,
    decimal CommissionPercent = 0,
    string? BranchName = null,
    string? TenantName = null
);

public record UpdateUserRequest(
    string FullName,
    string? Phone,
    string? DocumentType,
    string? DocumentNumber
);
