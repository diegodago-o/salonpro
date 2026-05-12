using SalonPro.SalonOperations.Domain.Enums;

namespace SalonPro.SalonOperations.Domain.Entities;

public class Anticipo
{
    public int Id { get; private set; }
    public int TenantId { get; private set; }
    public int? ClientId { get; private set; }
    public string ClientName { get; private set; } = string.Empty;
    public string ClientDocument { get; private set; } = string.Empty;
    public string ClientPhone { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public int PaymentMethodId { get; private set; }
    public string PaymentMethodName { get; private set; } = string.Empty;
    public string? Notes { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public AnticipoStatus Status { get; private set; }

    private Anticipo() { }

    public static Anticipo Create(int tenantId, int? clientId, string clientName, string clientDocument,
        string clientPhone, decimal amount, int paymentMethodId, string paymentMethodName, string? notes)
    {
        return new Anticipo
        {
            TenantId = tenantId,
            ClientId = clientId,
            ClientName = clientName,
            ClientDocument = clientDocument,
            ClientPhone = clientPhone,
            Amount = amount,
            PaymentMethodId = paymentMethodId,
            PaymentMethodName = paymentMethodName,
            Notes = notes,
            CreatedAt = DateTime.UtcNow,
            Status = AnticipoStatus.Active
        };
    }

    public void Apply() => Status = AnticipoStatus.Applied;
    public void Void() => Status = AnticipoStatus.Voided;
}
