using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Enums;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Commands;

public record CreateLiquidacionRequest(int StylistId, string StylistName, string StartDate, string EndDate);

public record CreateLiquidacionCommand(int TenantId, CreateLiquidacionRequest Request) : IRequest<LiquidacionResumenDto>;

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

        // Get sales for stylist in date range
        var sales = (await saleRepo.GetByStylistAndDateRangeAsync(
            cmd.TenantId, req.StylistId, startDate, endDate, ct: ct))
            .Where(s => s.Status == SaleStatus.Active)
            .ToList();

        // Get active/applied anticipos for this stylist (by client) — simplified: get all tenant anticipos Applied
        // For MVP, anticipos applied = 0 (requires linking anticipo to stylist)
        decimal anticiposAplicados = 0;

        // Calculate totals from sales
        var grossServices = sales.Sum(s => s.GrossServices);
        var grossProducts = sales.Sum(s => s.GrossProducts);
        var totalDeductions = sales.Sum(s => s.TotalDeductions);
        var totalTips = sales.Sum(s => s.TipAmount);
        var internalConsumption = sales.Sum(s => s.InternalConsumption);

        // Commission on services (MVP: 50% of (grossServices - deductionOnServices - salonFeeOnServices))
        // Simplified: use stored StylistTotal if available, else 50%
        var commServices = Math.Round(grossServices * 0.5m, 2);
        var commProducts = Math.Round(grossProducts * 0.3m, 2);

        var netoPeluquero = commServices + commProducts + totalTips - anticiposAplicados;

        var liquidacion = Liquidacion.Create(
            cmd.TenantId, req.StylistId, req.StylistName,
            startDate, DateTime.Parse(req.EndDate));

        liquidacion.SetTotals(sales.Count, grossServices, grossProducts, totalDeductions,
            commServices, commProducts, totalTips, internalConsumption, anticiposAplicados, netoPeluquero);

        // Add venta records
        foreach (var sale in sales)
        {
            var deduction = sale.TotalDeductions;
            var saleCommServices = Math.Round(sale.GrossServices * 0.5m, 2);
            var saleCommProducts = Math.Round(sale.GrossProducts * 0.3m, 2);
            liquidacion.Ventas.Add(LiquidacionVenta.Create(
                0, sale.Id, sale.SaleDateTime, sale.ClientName,
                sale.GrossServices, sale.GrossProducts, deduction,
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
