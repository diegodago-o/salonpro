using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetLiquidacionDetalleQuery(int Id, int TenantId) : IRequest<LiquidacionDetalleDto>;

public class GetLiquidacionDetalleHandler(ILiquidacionRepository repo, ISaleRepository saleRepo)
    : IRequestHandler<GetLiquidacionDetalleQuery, LiquidacionDetalleDto>
{
    public async Task<LiquidacionDetalleDto> Handle(GetLiquidacionDetalleQuery query, CancellationToken ct)
    {
        var l = await repo.GetByIdWithVentasAsync(query.Id, ct)
            ?? throw new NotFoundException("Liquidacion", query.Id);
        if (l.TenantId != query.TenantId) throw new ForbiddenException();

        // Cargar las ventas reales con sus pagos para construir el desglose de deducciones
        var saleIds = l.Ventas.Select(v => v.SaleId).ToList();
        var salesWithPayments = (await saleRepo.GetByIdsWithPaymentsAsync(saleIds, ct))
            .ToDictionary(s => s.Id);

        // Agrupar pagos por (método de pago, porcentaje) y sumar montos de deducción
        var deduccionesDetalle = salesWithPayments.Values
            .SelectMany(s => s.Payments)
            .Where(p => p.DeductionPercent > 0 && p.DeductionAmount > 0)
            .GroupBy(p => new { p.PaymentMethodName, p.DeductionPercent })
            .Select(g => new DeduccionDetalleDto(
                g.Key.PaymentMethodName,
                g.Key.DeductionPercent,
                Math.Round(g.Sum(p => p.DeductionAmount), 2)))
            .OrderByDescending(d => d.TotalAmount)
            .ToList();

        // Construir ventas con resumen de métodos de pago e ítems de consumo interno
        var ventas = l.Ventas.Select(v =>
        {
            salesWithPayments.TryGetValue(v.SaleId, out var sale);

            var methodsSummary = sale is not null
                ? string.Join(", ", sale.Payments.GroupBy(p => p.PaymentMethodName).Select(g => g.Key))
                : string.Empty;

            var internalItems = sale?.Items
                .Where(i => i.Type == SalonPro.SalonOperations.Domain.Enums.SaleItemType.ProductInternal)
                .Select(i => $"{i.Name} → ${(i.UnitPrice * i.Quantity):N0}")
                .ToList() ?? [];

            // Calcular comisión por ítem (misma lógica que CreateLiquidacionCommand y desgloseDetalle)
            var serviceCommItems = new List<string>();
            var productCommItems = new List<string>();
            decimal dynCommServices = 0m;
            decimal dynCommProducts = 0m;

            if (sale is not null)
            {
                var saleGrossAll = sale.GrossServices + sale.GrossProducts + sale.TipAmount;
                var dedPct = saleGrossAll > 0 ? sale.TotalDeductions / saleGrossAll : 0m;
                var commPct = sale.CommissionPercent / 100m;
                var commPctLabel = (int)Math.Round(sale.CommissionPercent);

                foreach (var item in sale.Items.Where(i =>
                    i.Type == SalonPro.SalonOperations.Domain.Enums.SaleItemType.Service))
                {
                    var subtotal = item.UnitPrice * item.Quantity;
                    var netBase = subtotal * (1 - dedPct);
                    decimal stylistAmt;
                    if (item.SalonFeePercent > 0)
                    {
                        var fee = netBase * item.SalonFeePercent / 100m;
                        stylistAmt = Math.Round((netBase - fee) * commPct, 0);
                    }
                    else
                    {
                        stylistAmt = Math.Round(netBase * commPct, 0);
                    }
                    dynCommServices += stylistAmt;
                    serviceCommItems.Add($"{item.Name} · {commPctLabel}% → ${stylistAmt:N0}");
                }

                foreach (var item in sale.Items.Where(i =>
                    i.Type == SalonPro.SalonOperations.Domain.Enums.SaleItemType.ProductSale))
                {
                    var subtotal = item.UnitPrice * item.Quantity;
                    var netBase = subtotal * (1 - dedPct);
                    var prodCommPct = item.StylistCommissionPercent / 100m;
                    var prodCommPctLabel = (int)Math.Round(item.StylistCommissionPercent);
                    var stylistAmt = Math.Round(netBase * prodCommPct, 0);
                    dynCommProducts += stylistAmt;
                    productCommItems.Add($"{item.Name} · {prodCommPctLabel}% → ${stylistAmt:N0}");
                }
            }

            // Usar valores dinámicos (correctos) en lugar de los almacenados (pueden ser incorrectos
            // en liquidaciones creadas antes de este fix)
            return new LiquidacionVentaDto(
                v.SaleId, v.SaleDateTime.ToString("o"), v.ClientName,
                v.GrossServices, v.GrossProducts, v.Deduction,
                dynCommServices, dynCommProducts, v.Tip, v.InternalConsumption,
                methodsSummary, internalItems, serviceCommItems, productCommItems);
        }).ToList();

        // Totales globales calculados dinámicamente por ítem (consistentes con el desglose)
        var totalCommServices = ventas.Sum(v => v.CommServices);
        var totalCommProducts = ventas.Sum(v => v.CommProducts);

        return new LiquidacionDetalleDto(
            l.Id, l.StylistId, l.StylistName,
            l.StartDate.ToString("yyyy-MM-dd"), l.EndDate.ToString("yyyy-MM-dd"),
            l.TotalVentas, l.GrossServices, l.GrossProducts, l.TotalDeductions,
            totalCommServices, totalCommProducts, l.TotalTips, l.InternalConsumption,
            l.AnticiposAplicados, l.NetoPeluquero, l.Status.ToString(),
            ventas, deduccionesDetalle);
    }
}
