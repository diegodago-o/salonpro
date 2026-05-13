using SalonPro.SalonOperations.Domain.Enums;

namespace SalonPro.SalonOperations.Domain.Entities;

public class Sale
{
    public int Id { get; private set; }
    public int TenantId { get; private set; }
    public int StylistId { get; private set; }
    public string StylistName { get; private set; } = string.Empty;
    public int? ClientId { get; private set; }
    public string ClientName { get; private set; } = string.Empty;
    public string ClientDocument { get; private set; } = string.Empty;
    public string? ClientDocumentType { get; private set; }
    public string? ClientEmail { get; private set; }
    public string? ClientPhone { get; private set; }
    public int? CashRegisterId { get; private set; }
    public int? BranchId { get; private set; }
    public string? BranchName { get; private set; }
    public decimal CommissionPercent { get; private set; }
    public DateTime SaleDateTime { get; private set; }
    public decimal GrossServices { get; private set; }
    public decimal GrossProducts { get; private set; }
    public decimal InternalConsumption { get; private set; }
    public decimal TipAmount { get; private set; }
    public decimal TotalDeductions { get; private set; }
    public decimal StylistTotal { get; private set; }
    public decimal SalonTotal { get; private set; }
    public decimal GrossTotal { get; private set; }
    public SaleStatus Status { get; private set; }
    public string? VoidedReason { get; private set; }
    public DateTime? VoidedAt { get; private set; }
    public string? Notes { get; private set; }

    public ICollection<SaleItem> Items { get; private set; } = [];
    public ICollection<SalePayment> Payments { get; private set; } = [];

    private Sale() { }

    public static Sale Create(
        int tenantId, int stylistId, string stylistName,
        int? clientId, string clientName, string clientDocument,
        string? clientDocumentType, string? clientEmail, string? clientPhone,
        int? cashRegisterId, int? branchId, string? branchName, decimal commissionPercent,
        decimal grossServices, decimal grossProducts, decimal internalConsumption,
        decimal tipAmount, decimal totalDeductions, decimal stylistTotal, decimal salonTotal,
        string? notes)
    {
        var grossTotal = grossServices + grossProducts + tipAmount;
        return new Sale
        {
            TenantId = tenantId,
            StylistId = stylistId,
            StylistName = stylistName,
            ClientId = clientId,
            ClientName = clientName,
            ClientDocument = clientDocument,
            ClientDocumentType = clientDocumentType,
            ClientEmail = clientEmail,
            ClientPhone = clientPhone,
            CashRegisterId = cashRegisterId,
            BranchId = branchId,
            BranchName = branchName,
            CommissionPercent = commissionPercent,
            SaleDateTime = DateTime.UtcNow,
            GrossServices = grossServices,
            GrossProducts = grossProducts,
            InternalConsumption = internalConsumption,
            TipAmount = tipAmount,
            TotalDeductions = totalDeductions,
            StylistTotal = stylistTotal,
            SalonTotal = salonTotal,
            GrossTotal = grossTotal,
            Status = SaleStatus.Active,
            Notes = notes
        };
    }

    public void Void(string reason)
    {
        Status = SaleStatus.Voided;
        VoidedReason = reason;
        VoidedAt = DateTime.UtcNow;
    }
}
