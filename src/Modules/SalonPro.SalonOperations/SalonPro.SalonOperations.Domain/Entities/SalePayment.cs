namespace SalonPro.SalonOperations.Domain.Entities;

public class SalePayment
{
    public int Id { get; private set; }
    public int SaleId { get; private set; }
    public int PaymentMethodId { get; private set; }
    public string PaymentMethodName { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public decimal DeductionPercent { get; private set; }
    public decimal DeductionAmount { get; private set; }

    public Sale? Sale { get; private set; }

    private SalePayment() { }

    public static SalePayment CreateForSale(Sale sale, int paymentMethodId, string paymentMethodName,
        decimal amount, decimal deductionPercent)
    {
        var deductionAmount = Math.Round(amount * deductionPercent / 100, 2);
        return new SalePayment
        {
            Sale = sale,
            SaleId = 0,
            PaymentMethodId = paymentMethodId,
            PaymentMethodName = paymentMethodName,
            Amount = amount,
            DeductionPercent = deductionPercent,
            DeductionAmount = deductionAmount
        };
    }
}
