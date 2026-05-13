using SalonPro.SalonOperations.Domain.Enums;

namespace SalonPro.SalonOperations.Domain.Entities;

public class Liquidacion
{
    public int Id { get; private set; }
    public int TenantId { get; private set; }
    public int? BranchId { get; private set; }
    public int StylistId { get; private set; }
    public string StylistName { get; private set; } = string.Empty;
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public int TotalVentas { get; private set; }
    public decimal GrossServices { get; private set; }
    public decimal GrossProducts { get; private set; }
    public decimal TotalDeductions { get; private set; }
    public decimal CommServices { get; private set; }
    public decimal CommProducts { get; private set; }
    public decimal TotalTips { get; private set; }
    public decimal InternalConsumption { get; private set; }
    public decimal AnticiposAplicados { get; private set; }
    public decimal NetoPeluquero { get; private set; }
    public LiquidacionStatus Status { get; private set; }

    public ICollection<LiquidacionVenta> Ventas { get; private set; } = [];

    private Liquidacion() { }

    public static Liquidacion Create(int tenantId, int? branchId, int stylistId, string stylistName,
        DateTime startDate, DateTime endDate)
    {
        return new Liquidacion
        {
            TenantId = tenantId,
            BranchId = branchId,
            StylistId = stylistId,
            StylistName = stylistName,
            StartDate = startDate,
            EndDate = endDate,
            Status = LiquidacionStatus.Open
        };
    }

    public void SetTotals(int totalVentas, decimal grossServices, decimal grossProducts,
        decimal totalDeductions, decimal commServices, decimal commProducts,
        decimal totalTips, decimal internalConsumption, decimal anticiposAplicados, decimal netoPeluquero)
    {
        TotalVentas = totalVentas;
        GrossServices = grossServices;
        GrossProducts = grossProducts;
        TotalDeductions = totalDeductions;
        CommServices = commServices;
        CommProducts = commProducts;
        TotalTips = totalTips;
        InternalConsumption = internalConsumption;
        AnticiposAplicados = anticiposAplicados;
        NetoPeluquero = netoPeluquero;
    }

    public void Close() => Status = LiquidacionStatus.Closed;
}
