namespace SalonPro.SalonOperations.Domain.Entities;

public class SalonProduct
{
    public int Id { get; private set; }
    public int TenantId { get; private set; }
    public int BranchId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Brand { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty;
    public decimal PurchasePrice { get; private set; }
    public decimal SalePrice { get; private set; }
    /// <summary>Porcentaje de comisión del estilista sobre el precio neto de este producto (0–100). Por defecto 10.</summary>
    public decimal StylistCommissionPercent { get; private set; }
    public int Stock { get; private set; }
    public bool IsForSale { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private SalonProduct() { }

    public static SalonProduct Create(int tenantId, int branchId, string name, string brand, string category,
        decimal purchasePrice, decimal salePrice, int stock, bool isForSale, decimal stylistCommissionPercent = 10m)
    {
        return new SalonProduct
        {
            TenantId = tenantId,
            BranchId = branchId,
            Name = name.Trim(),
            Brand = brand.Trim(),
            Category = category.Trim(),
            PurchasePrice = purchasePrice,
            SalePrice = salePrice,
            StylistCommissionPercent = Math.Clamp(stylistCommissionPercent, 0m, 100m),
            Stock = stock,
            IsForSale = isForSale,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(string name, string brand, string category, decimal purchasePrice,
        decimal salePrice, bool isForSale, decimal stylistCommissionPercent)
    {
        Name = name.Trim();
        Brand = brand.Trim();
        Category = category.Trim();
        PurchasePrice = purchasePrice;
        SalePrice = salePrice;
        IsForSale = isForSale;
        StylistCommissionPercent = Math.Clamp(stylistCommissionPercent, 0m, 100m);
    }

    public void AdjustStock(int stock) => Stock = stock;
    public void SetActive(bool isActive) => IsActive = isActive;
    public void DecrementStock(int quantity) => Stock = Math.Max(0, Stock - quantity);
}
