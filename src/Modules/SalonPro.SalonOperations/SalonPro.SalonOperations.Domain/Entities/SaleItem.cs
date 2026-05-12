using SalonPro.SalonOperations.Domain.Enums;

namespace SalonPro.SalonOperations.Domain.Entities;

public class SaleItem
{
    public int Id { get; private set; }
    public int SaleId { get; private set; }
    public SaleItemType Type { get; private set; }
    public int ReferenceId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }
    public decimal SalonFeePercent { get; private set; }

    public Sale? Sale { get; private set; }

    private SaleItem() { }

    public static SaleItem Create(int saleId, SaleItemType type, int referenceId, string name,
        decimal unitPrice, int quantity, decimal salonFeePercent = 0)
    {
        return new SaleItem
        {
            SaleId = saleId,
            Type = type,
            ReferenceId = referenceId,
            Name = name,
            UnitPrice = unitPrice,
            Quantity = quantity,
            SalonFeePercent = salonFeePercent
        };
    }

    public static SaleItem CreateForSale(Sale sale, SaleItemType type, int referenceId, string name,
        decimal unitPrice, int quantity, decimal salonFeePercent = 0)
    {
        return new SaleItem
        {
            SaleId = 0,
            Sale = sale,
            Type = type,
            ReferenceId = referenceId,
            Name = name,
            UnitPrice = unitPrice,
            Quantity = quantity,
            SalonFeePercent = salonFeePercent
        };
    }
}
