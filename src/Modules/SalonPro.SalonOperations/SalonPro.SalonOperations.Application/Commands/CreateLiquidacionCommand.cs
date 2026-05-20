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
        var grossServices       = sales.Sum(s => s.GrossServices);
        var grossProducts       = sales.Sum(s => s.GrossProducts);
        var totalDeductions     = sales.Sum(s => s.TotalDeductions);
        var internalConsumption = sales.Sum(s => s.InternalConsumption);

        // StylistTotal already includes netTip and is net of card deductions.
        // Compute net tips per sale (tip proportionally reduced by deduction ratio).
        var totalStylistComm = sales.Sum(s => s.StylistTotal);
        var totalNetTips = sales.Sum(s =>
        {
            if (s.TipAmount == 0) return 0m;
            var grossAll       = s.GrossServices + s.GrossProducts + s.TipAmount;
            var tipDeduction   = grossAll > 0 ? Math.Round(s.TotalDeductions * s.TipAmount / grossAll, 2) : 0m;
            return s.TipAmount - tipDeduction;
        });

        // commServices / commProducts = commissions on items ONLY (tip excluded)
        // so that the receipt breakdown is clean and tip shows as a separate line.
        var commOnItems  = totalStylistComm - totalNetTips;
        var grossItemsTotal = grossServices + grossProducts;
        var commServices = grossItemsTotal > 0
            ? Math.Round(commOnItems * grossServices / grossItemsTotal, 2)
            : commOnItems;
        var commProducts = Math.Round(commOnItems - commServices, 2);

        // netoPeluquero = total earned (incl. net tips) − internal consumption − anticipos
        // NOTE: deducciones are already baked into totalStylistComm (net amounts).
        var netoPeluquero = Math.Round(totalStylistComm - internalConsumption - anticiposAplicados, 2);

        var liquidacion = Liquidacion.Create(
            cmd.TenantId, cmd.BranchId, req.StylistId, req.StylistName,
            startDate, DateTime.Parse(req.EndDate));

        // Store totalNetTips (net, after deductions) so the receipt displays correctly
        liquidacion.SetTotals(sales.Count, grossServices, grossProducts, totalDeductions,
            commServices, commProducts, totalNetTips, internalConsumption, anticiposAplicados, netoPeluquero);

        // Add venta records — per-sale, split commissions excluding tip
        foreach (var sale in sales)
        {
            // Net tip for this sale
            var saleGrossAll   = sale.GrossServices + sale.GrossProducts + sale.TipAmount;
            var saleTipDed     = saleGrossAll > 0
                ? Math.Round(sale.TotalDeductions * sale.TipAmount / saleGrossAll, 2) : 0m;
            var saleNetTip     = sale.TipAmount - saleTipDed;

            // Commission on items only
            var saleCommOnItems  = sale.StylistTotal - saleNetTip;
            var saleGrossItems   = sale.GrossServices + sale.GrossProducts;
            var saleCommServices = saleGrossItems > 0
                ? Math.Round(saleCommOnItems * sale.GrossServices / saleGrossItems, 2)
                : saleCommOnItems;
            var saleCommProducts = Math.Round(saleCommOnItems - saleCommServices, 2);

            liquidacion.Ventas.Add(LiquidacionVenta.Create(
                0, sale.Id, sale.SaleDateTime, sale.ClientName,
                sale.GrossServices, sale.GrossProducts, sale.TotalDeductions,
                saleCommServices, saleCommProducts, saleNetTip, sale.InternalConsumption));
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
