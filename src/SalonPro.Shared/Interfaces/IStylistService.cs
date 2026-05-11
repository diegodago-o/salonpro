namespace SalonPro.Shared.Interfaces;

public interface IStylistService
{
    Task<StylistInfo?> GetByIdAsync(int stylistId, CancellationToken ct = default);
    Task<decimal> GetCommissionPercentAsync(int stylistId, CancellationToken ct = default);
    Task<IEnumerable<StylistInfo>> GetByBranchAsync(int branchId, CancellationToken ct = default);
}

public record StylistInfo(int Id, int TenantId, int BranchId, string FullName, decimal CommissionPercent);
