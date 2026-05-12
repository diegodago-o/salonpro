using SalonPro.SalonOperations.Domain.Enums;

namespace SalonPro.SalonOperations.Domain.Entities;

public class CashRegister
{
    public int Id { get; private set; }
    public int TenantId { get; private set; }
    public int BranchId { get; private set; }
    public string BranchName { get; private set; } = string.Empty;
    public int CashierId { get; private set; }
    public string CashierName { get; private set; } = string.Empty;
    public DateTime OpenedAt { get; private set; }
    public DateTime? ClosedAt { get; private set; }
    public decimal OpeningBalance { get; private set; }
    public decimal? DeclaredCash { get; private set; }
    public decimal? ExpectedCash { get; private set; }
    public decimal? Difference { get; private set; }
    public CashRegisterStatus Status { get; private set; }
    public string? Notes { get; private set; }

    public ICollection<CashRegisterDetail> Details { get; private set; } = [];

    private CashRegister() { }

    public static CashRegister Open(int tenantId, int branchId, string branchName,
        int cashierId, string cashierName, decimal openingBalance, string? notes)
    {
        return new CashRegister
        {
            TenantId = tenantId,
            BranchId = branchId,
            BranchName = branchName,
            CashierId = cashierId,
            CashierName = cashierName,
            OpenedAt = DateTime.UtcNow,
            OpeningBalance = openingBalance,
            Status = CashRegisterStatus.Open,
            Notes = notes
        };
    }

    public void Close(decimal declaredCash, decimal expectedCash, string? notes)
    {
        DeclaredCash = declaredCash;
        ExpectedCash = expectedCash;
        Difference = declaredCash - expectedCash;
        ClosedAt = DateTime.UtcNow;
        Status = CashRegisterStatus.Closed;
        if (notes != null) Notes = notes;
    }
}
