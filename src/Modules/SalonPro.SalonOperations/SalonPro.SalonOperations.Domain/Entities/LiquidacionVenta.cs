namespace SalonPro.SalonOperations.Domain.Entities;

public class LiquidacionVenta
{
    public int Id { get; private set; }
    public int LiquidacionId { get; private set; }
    public int SaleId { get; private set; }
    public DateTime SaleDateTime { get; private set; }
    public string ClientName { get; private set; } = string.Empty;
    public decimal GrossServices { get; private set; }
    public decimal GrossProducts { get; private set; }
    public decimal Deduction { get; private set; }
    public decimal CommServices { get; private set; }
    public decimal CommProducts { get; private set; }
    public decimal Tip { get; private set; }
    public decimal InternalConsumption { get; private set; }

    public Liquidacion? Liquidacion { get; private set; }

    private LiquidacionVenta() { }

    public static LiquidacionVenta Create(int liquidacionId, int saleId, DateTime saleDateTime,
        string clientName, decimal grossServices, decimal grossProducts, decimal deduction,
        decimal commServices, decimal commProducts, decimal tip, decimal internalConsumption)
    {
        return new LiquidacionVenta
        {
            LiquidacionId = liquidacionId,
            SaleId = saleId,
            SaleDateTime = saleDateTime,
            ClientName = clientName,
            GrossServices = grossServices,
            GrossProducts = grossProducts,
            Deduction = deduction,
            CommServices = commServices,
            CommProducts = commProducts,
            Tip = tip,
            InternalConsumption = internalConsumption
        };
    }
}
