namespace SalonPro.SalonOperations.Domain.Entities;

public class SalonService
{
    public int Id { get; private set; }
    public int TenantId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public bool HasSalonFee { get; private set; }
    public decimal SalonFeePercent { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private SalonService() { }

    public static SalonService Create(int tenantId, string name, string category, decimal price,
        bool hasSalonFee, decimal salonFeePercent)
    {
        return new SalonService
        {
            TenantId = tenantId,
            Name = name.Trim(),
            Category = category.Trim(),
            Price = price,
            HasSalonFee = hasSalonFee,
            SalonFeePercent = salonFeePercent,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(string name, string category, decimal price, bool hasSalonFee, decimal salonFeePercent)
    {
        Name = name.Trim();
        Category = category.Trim();
        Price = price;
        HasSalonFee = hasSalonFee;
        SalonFeePercent = salonFeePercent;
    }

    public void SetActive(bool isActive) => IsActive = isActive;
}
