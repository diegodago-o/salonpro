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
    IAnticipoColaboradorRepository anticipoColabRepo)
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

        // Anticipos pendientes y libres (sin reserva) para este estilista
        var anticiposPendientes = (await anticipoColabRepo.GetLibresPendientesByStylistAsync(
            cmd.TenantId, req.StylistId, ct)).ToList();
        decimal anticiposAplicados = anticiposPendientes.Sum(a => a.Amount);

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

        // netoPeluquero = total earned (incl. net tips) − internal consumption − anticipos
        // NOTE: deducciones are already baked into totalStylistComm (net amounts).
        var netoPeluquero = Math.Round(totalStylistComm - internalConsumption - anticiposAplicados, 2);

        var liquidacion = Liquidacion.Create(
            cmd.TenantId, cmd.BranchId, req.StylistId, req.StylistName,
            startDate, DateTime.Parse(req.EndDate));

        // Acumular commServices / commProducts por ítem real (misma lógica que
        // GetLiquidacionDetalleQuery y desgloseDetalle del frontend).
        decimal commServices = 0m;
        decimal commProducts = 0m;

        // Add venta records — per-sale, split commissions by actual per-item rates
        foreach (var sale in sales)
        {
            // Net tip for this sale
            var saleGrossAll = sale.GrossServices + sale.GrossProducts + sale.TipAmount;
            var saleTipDed   = saleGrossAll > 0
                ? Math.Round(sale.TotalDeductions * sale.TipAmount / saleGrossAll, 2) : 0m;
            var saleNetTip   = sale.TipAmount - saleTipDed;

            // Commission per item type
            var saleDedPct  = saleGrossAll > 0 ? sale.TotalDeductions / saleGrossAll : 0m;
            var saleCommPct = sale.CommissionPercent / 100m;
            decimal saleCommServices = 0m;
            decimal saleCommProducts = 0m;

            foreach (var item in sale.Items.Where(i => i.Type == SaleItemType.Service))
            {
                var subtotal = item.UnitPrice * item.Quantity;
                var netBase  = subtotal * (1 - saleDedPct);
                decimal amt;
                if (item.SalonFeePercent > 0)
                {
                    var fee = netBase * item.SalonFeePercent / 100m;
                    amt = Math.Round((netBase - fee) * saleCommPct, 2);
                }
                else
                {
                    amt = Math.Round(netBase * saleCommPct, 2);
                }
                saleCommServices += amt;
            }

            foreach (var item in sale.Items.Where(i => i.Type == SaleItemType.ProductSale))
            {
                var subtotal    = item.UnitPrice * item.Quantity;
                var netBase     = subtotal * (1 - saleDedPct);
                var prodCommPct = item.StylistCommissionPercent / 100m;
                saleCommProducts += Math.Round(netBase * prodCommPct, 2);
            }

            commServices += saleCommServices;
            commProducts += saleCommProducts;

            liquidacion.Ventas.Add(LiquidacionVenta.Create(
                0, sale.Id, sale.SaleDateTime, sale.ClientName,
                sale.GrossServices, sale.GrossProducts, sale.TotalDeductions,
                saleCommServices, saleCommProducts, saleNetTip, sale.InternalConsumption));
        }

        // Fijar totales globales DESPUÉS del foreach (commServices/commProducts ya acumulados)
        liquidacion.SetTotals(sales.Count, grossServices, grossProducts, totalDeductions,
            commServices, commProducts, totalNetTips, internalConsumption, anticiposAplicados, netoPeluquero);

        await liquidacionRepo.AddAsync(liquidacion, ct);
        await liquidacionRepo.SaveChangesAsync(ct);  // liquidacion.Id ya está asignado por la BD

        // Reservar los anticipos para esta liquidación (cruce único garantizado)
        foreach (var anticipo in anticiposPendientes)
            anticipo.Reserve(liquidacion.Id);
        if (anticiposPendientes.Count > 0)
            await anticipoColabRepo.SaveChangesAsync(ct);

        return new LiquidacionResumenDto(
            liquidacion.Id, liquidacion.StylistId, liquidacion.StylistName,
            liquidacion.StartDate.ToString("yyyy-MM-dd"), liquidacion.EndDate.ToString("yyyy-MM-dd"),
            liquidacion.TotalVentas, liquidacion.GrossServices, liquidacion.GrossProducts,
            liquidacion.TotalDeductions, liquidacion.CommServices, liquidacion.CommProducts,
            liquidacion.TotalTips, liquidacion.InternalConsumption,
            liquidacion.AnticiposAplicados, liquidacion.NetoPeluquero, liquidacion.Status.ToString());
    }
}
