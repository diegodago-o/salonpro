using SalonPro.Tenants.Domain.Enums;

namespace SalonPro.Tenants.Domain.Entities;

public class Tenant
{
    public int Id { get; private set; }
    public string BusinessName { get; private set; } = string.Empty;
    public string? TradeName { get; private set; }
    public string Nit { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string? Address { get; private set; }
    public string? City { get; private set; }
    public string? LogoUrl { get; private set; }
    public TenantStatus Status { get; private set; }
    public DateTime? TrialEndsAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public string? CreatedBy { get; private set; }

    public Subscription? Subscription { get; private set; }
    public ICollection<Branch> Branches { get; private set; } = [];

    private Tenant() { }

    public static Tenant Create(string businessName, string? tradeName, string nit, string slug,
        string email, string? phone, string? address, string? city, string? createdBy)
    {
        return new Tenant
        {
            BusinessName = businessName,
            TradeName = tradeName,
            Nit = nit,
            Slug = slug.ToLower().Trim(),
            Email = email.ToLower().Trim(),
            Phone = phone,
            Address = address,
            City = city,
            Status = TenantStatus.Trial,
            TrialEndsAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };
    }

    public void Update(string businessName, string? tradeName, string? phone, string? address, string? city, string? logoUrl)
    {
        BusinessName = businessName;
        TradeName = tradeName;
        Phone = phone;
        Address = address;
        City = city;
        LogoUrl = logoUrl;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangeStatus(TenantStatus newStatus)
    {
        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;
    }

    public bool CanAccess() =>
        Status is TenantStatus.Trial or TenantStatus.Active;
}
