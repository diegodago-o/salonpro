using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Enums;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Commands;

public record CreateLiquidacionRequest(int StylistId, string StylistName, string StartDate, string EndDate);

public record CreateLiquidacionCommand(int TenantId, int? BranchId, CreateLiquidacionRequest Request) : IRequest<LiquidacionResumenDto>;

public class CreateLiquidacionHandler(
    ILiquidacionRepository liquidacionRepo,
    ISaleRepository saleRepo,
    IAnticipoRepository anticipoRepo)
    : IRequestHandler<CreateLiquidacionCommand, LiquidacionResumenDto>
{
    public async Task<LiquidacionResumenDto> Handle(CreateLiquidacionCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;
        var startDate = DateTime.Parse(req.StartDate);
        var endDate = DateTime.Parse(req.EndDate).AddDays(1).AddSeconds(-1); // end of day

        // Get sales for stylist in date range (filtered by branch if provided)
        var sales = (await saleRepo.GetByStylistAndDateRangeAsync(
            cmd.TenantId, req.StylistId, startDate, endDate, branchId: cmd.BranchId, ct: ct))
            .Where(s => s.Status == SaleStatus.Active)
            .ToList();

        // Anticipos applied = 0 for MVP (requires linking anticipo to stylist)
        decimal anticiposAplicados = 0;

        // Calculate totals from sales
        var grossServices      = sales.Sum(s => s.GrossServices);
        var grossProducts      = sales.Sum(s => s.GrossProducts);
        var totalDeductions    = sales.Sum(s => s.TotalDeductions);
        var totalTips          = sales.Sum(s => s.TipAmount);
        var internalConsumption = sales.Sum(s => s.InternalConsumption);

        // Use StylistTotal stored per sale — already correctly calculated during sale registration
        // (accounts for commission %, deductions, salon fees, product commissions)
        var totalStylistComm = sales.Sum(s => s.StylistTotal);

        // Split proportionally between services and products for display
        var grossTotal = grossServices + grossProducts;
        var commServices = grossTotal > 0
            ? Math.Round(totalStylistComm * grossServices / grossTotal, 2)
            : totalStylistComm;
        var commProducts = Math.Round(totalStylistComm - commServices, 2);

        var netoPeluquero = Math.Round(totalStylistComm + totalTips - anticiposAplicados, 2);

        var liquidacion = Liquidacion.Create(
            cmd.TenantId, cmd.BranchId, req.StylistId, req.StylistName,
            startDate, DateTime.Parse(req.EndDate));

        liquidacion.SetTotals(sales.Count, grossServices, grossProducts, totalDeductions,
            commServices, commProducts, totalTips, internalConsumption, anticiposAplicados, netoPeluquero);

        // Add venta records
        foreach (var sale in sales)
        {
            // Use StylistTotal from the sale, split proportionally between services and products
            var saleGross = sale.GrossServices + sale.GrossProducts;
            var saleComm = sale.StylistTotal;
            var saleCommServices = saleGross > 0
                ? Math.Round(saleComm * sale.GrossServices / saleGross, 2)
                : saleComm;
            var saleCommProducts = Math.Round(saleComm - saleCommServices, 2);
            liquidacion.Ventas.Add(LiquidacionVenta.Create(
                0, sale.Id, sale.SaleDateTime, sale.ClientName,
                sale.GrossServices, sale.GrossProducts, sale.TotalDeductions,
                saleCommServices, saleCommProducts, sale.TipAmount, sale.InternalConsumption));
        }

        await liquidacionRepo.AddAsync(liquidacion, ct);
        await liquidacionRepo.SaveChangesAsync(ct);

        return new LiquidacionResumenDto(
            liquidacion.Id, liquidacion.StylistId, liquidacion.StylistName,
            liquidacion.StartDate.ToString("yyyy-MM-dd"), liquidacion.EndDate.ToString("yyyy-MM-dd"),
            liquidacion.TotalVentas, liquidacion.GrossServices, liquidacion.GrossProducts,
            liquidacion.TotalDeductions, liquidacion.CommServices, liquidacion.CommProducts,
            liquidacion.TotalTips, liquidacion.InternalConsumption,
            liquidacion.AnticiposAplicados, liquidacion.NetoPeluquero, liquidacion.Status.ToString());
    }
}
