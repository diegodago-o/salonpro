namespace SalonPro.SalonOperations.Domain.Entities;

public class PaymentMethod
{
    public int Id { get; private set; }
    public int TenantId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public bool HasDeduction { get; private set; }
    public decimal DeductionPercent { get; private set; }
    public bool IsActive { get; private set; }

    private PaymentMethod() { }

    public static PaymentMethod Create(int tenantId, string name, bool hasDeduction, decimal deductionPercent)
    {
        return new PaymentMethod
        {
            TenantId = tenantId,
            Name = name.Trim(),
            HasDeduction = hasDeduction,
            DeductionPercent = deductionPercent,
            IsActive = true
        };
    }

    public void Update(string name, bool hasDeduction, decimal deductionPercent)
    {
        Name = name.Trim();
        HasDeduction = hasDeduction;
        DeductionPercent = deductionPercent;
    }

    public void SetActive(bool isActive) => IsActive = isActive;
}
