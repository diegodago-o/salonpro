namespace SalonPro.Identity.Application.DTOs;

public record LoginRequest(string Email, string Password);

public record RefreshTokenRequest(string RefreshToken);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User
);

public record UserDto(
    int Id,
    string FullName,
    string Email,
    string Role,
    int? TenantId,
    int? BranchId,
    decimal CommissionPercent
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
    decimal CommissionPercent = 0
);

public record UpdateUserRequest(
    string FullName,
    string? Phone,
    string? DocumentType,
    string? DocumentNumber
);
