namespace SalonPro.Tenants.Domain.Entities;

public class Branch
{
    public int Id { get; private set; }
    public int TenantId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Address { get; private set; }
    public string? City { get; private set; }
    public string? Phone { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public Tenant Tenant { get; private set; } = null!;

    private Branch() { }

    public static Branch Create(int tenantId, string name, string? address, string? city, string? phone)
    {
        return new Branch
        {
            TenantId = tenantId,
            Name = name,
            Address = address,
            City = city,
            Phone = phone,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void Update(string name, string? address, string? city, string? phone)
    {
        Name = name;
        Address = address;
        City = city;
        Phone = phone;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }
}
