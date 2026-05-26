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
    string? TenantName,
    bool IsActive = true,
    string? EmployeeCode = null,
    string? Phone = null,
    string? DocumentNumber = null
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
    string? TenantName = null,
    string? EmployeeCode = null
);

public record UpdateUserRequest(
    string FullName,
    string? Phone,
    string? DocumentType,
    string? DocumentNumber
);

public record UpdateUserAdminRequest(
    string FullName,
    string Role,
    int?    BranchId,
    string? BranchName,
    decimal CommissionPercent,
    string? EmployeeCode,
    string? Phone = null,
    string? DocumentNumber = null
);
