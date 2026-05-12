namespace SalonPro.SalonOperations.Domain.Entities;

public class CashRegisterDetail
{
    public int Id { get; private set; }
    public int CashRegisterId { get; private set; }
    public int PaymentMethodId { get; private set; }
    public string PaymentMethodName { get; private set; } = string.Empty;
    public decimal TotalAmount { get; private set; }
    public decimal TotalDeductions { get; private set; }
    public decimal NetAmount { get; private set; }

    public CashRegister? CashRegister { get; private set; }

    private CashRegisterDetail() { }

    public static CashRegisterDetail Create(int cashRegisterId, int paymentMethodId,
        string paymentMethodName, decimal totalAmount, decimal totalDeductions)
    {
        return new CashRegisterDetail
        {
            CashRegisterId = cashRegisterId,
            PaymentMethodId = paymentMethodId,
            PaymentMethodName = paymentMethodName,
            TotalAmount = totalAmount,
            TotalDeductions = totalDeductions,
            NetAmount = totalAmount - totalDeductions
        };
    }
}
