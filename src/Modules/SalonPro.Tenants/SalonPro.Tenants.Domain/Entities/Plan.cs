namespace SalonPro.Tenants.Domain.Entities;

public class Plan
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int MaxBranches { get; private set; }
    public decimal PriceMonthly { get; private set; }
    public decimal PricePerExtra { get; private set; }
    public string? Features { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public ICollection<Subscription> Subscriptions { get; private set; } = [];

    private Plan() { }

    public static Plan Create(string name, int maxBranches, decimal priceMonthly, decimal pricePerExtra, string? features)
    {
        return new Plan
        {
            Name = name,
            MaxBranches = maxBranches,
            PriceMonthly = priceMonthly,
            PricePerExtra = pricePerExtra,
            Features = features,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void Update(string name, int maxBranches, decimal priceMonthly, decimal pricePerExtra, string? features)
    {
        Name = name;
        MaxBranches = maxBranches;
        PriceMonthly = priceMonthly;
        PricePerExtra = pricePerExtra;
        Features = features;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }
}
