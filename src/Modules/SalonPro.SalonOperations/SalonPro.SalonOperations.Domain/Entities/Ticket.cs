using SalonPro.SalonOperations.Domain.Enums;

namespace SalonPro.SalonOperations.Domain.Entities;

public class Ticket
{
    public int Id { get; private set; }
    public int TenantId { get; private set; }
    public int? BranchId { get; private set; }
    public string? BranchName { get; private set; }
    public int? ClientId { get; private set; }
    public string ClientName { get; private set; } = string.Empty;
    public DateTime SaleDateTime { get; private set; }
    public decimal GrossTotal { get; private set; }
    public decimal TipAmount { get; private set; }
    public string Status { get; private set; } = "Active";
    public DateTime CreatedAt { get; private set; }
    public string? Notes { get; private set; }

    public ICollection<Sale> Sales { get; private set; } = [];

    private Ticket() { }

    public static Ticket Create(
        int tenantId, int? branchId, string? branchName,
        int? clientId, string clientName,
        DateTime saleDateTime, decimal grossTotal, decimal tipAmount, string? notes)
    {
        return new Ticket
        {
            TenantId    = tenantId,
            BranchId    = branchId,
            BranchName  = branchName,
            ClientId    = clientId,
            ClientName  = clientName,
            SaleDateTime = saleDateTime,
            GrossTotal  = grossTotal,
            TipAmount   = tipAmount,
            Status      = "Active",
            CreatedAt   = DateTime.UtcNow,
            Notes       = notes,
        };
    }

    public void Void() => Status = "Voided";
}
