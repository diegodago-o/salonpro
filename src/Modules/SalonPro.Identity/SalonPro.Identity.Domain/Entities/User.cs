using SalonPro.Identity.Domain.Enums;

namespace SalonPro.Identity.Domain.Entities;

public class User
{
    public int Id { get; private set; }
    public int? TenantId { get; private set; }
    public int? BranchId { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string? DocumentType { get; private set; }
    public string? DocumentNumber { get; private set; }
    public string? Phone { get; private set; }
    public string? BranchName { get; private set; }
    public string? TenantName { get; private set; }
    public UserRole Role { get; private set; }
    public decimal CommissionPercent { get; private set; }
    public bool IsActive { get; private set; }
    public string? RefreshToken { get; private set; }
    public DateTime? RefreshTokenExpiresAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private User() { }

    public static User Create(string fullName, string email, string passwordHash,
        UserRole role, int? tenantId = null, int? branchId = null,
        string? documentType = null, string? documentNumber = null,
        string? phone = null, decimal commissionPercent = 0,
        string? branchName = null, string? tenantName = null)
    {
        return new User
        {
            FullName = fullName,
            Email = email.ToLower().Trim(),
            PasswordHash = passwordHash,
            Role = role,
            TenantId = tenantId,
            BranchId = branchId,
            DocumentType = documentType,
            DocumentNumber = documentNumber,
            Phone = phone,
            CommissionPercent = commissionPercent,
            BranchName = branchName,
            TenantName = tenantName,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void UpdateProfile(string fullName, string? phone, string? documentType, string? documentNumber)
    {
        FullName = fullName;
        Phone = phone;
        DocumentType = documentType;
        DocumentNumber = documentNumber;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateCommission(decimal commissionPercent)
    {
        CommissionPercent = commissionPercent;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetRefreshToken(string token, DateTime expiresAt)
    {
        RefreshToken = token;
        RefreshTokenExpiresAt = expiresAt;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RevokeRefreshToken()
    {
        RefreshToken = null;
        RefreshTokenExpiresAt = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public bool IsRefreshTokenValid(string token) =>
        RefreshToken == token && RefreshTokenExpiresAt > DateTime.UtcNow;
}
