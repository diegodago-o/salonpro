namespace SalonPro.SalonOperations.Domain.Entities;

public class SalonService
{
    public int Id { get; private set; }
    public int TenantId { get; private set; }
    public int BranchId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public bool HasSalonFee { get; private set; }
    public decimal SalonFeePercent { get; private set; }
    /// <summary>Porcentaje de participación del estilista para este servicio (0–100).</summary>
    public decimal StylistCommissionPercent { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private SalonService() { }

    public static SalonService Create(int tenantId, int branchId, string name, string category, decimal price,
        bool hasSalonFee, decimal salonFeePercent, decimal stylistCommissionPercent = 0)
    {
        return new SalonService
        {
            TenantId = tenantId,
            BranchId = branchId,
            Name = name.Trim(),
            Category = category.Trim(),
            Price = price,
            HasSalonFee = hasSalonFee,
            SalonFeePercent = salonFeePercent,
            StylistCommissionPercent = stylistCommissionPercent,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(string name, string category, decimal price, bool hasSalonFee, decimal salonFeePercent,
        decimal stylistCommissionPercent)
    {
        Name = name.Trim();
        Category = category.Trim();
        Price = price;
        HasSalonFee = hasSalonFee;
        SalonFeePercent = salonFeePercent;
        StylistCommissionPercent = stylistCommissionPercent;
    }

    public void SetActive(bool isActive) => IsActive = isActive;
}
