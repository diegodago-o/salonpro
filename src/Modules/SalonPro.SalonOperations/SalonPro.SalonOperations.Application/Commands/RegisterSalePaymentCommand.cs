using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Application.Queries;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Enums;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record RegisterSalePaymentRequest(List<SalePaymentRequest> Payments);

public record RegisterSalePaymentCommand(int TenantId, int SaleId, RegisterSalePaymentRequest Request)
    : IRequest<SaleDto>;

public class RegisterSalePaymentHandler(
    ISaleRepository saleRepo,
    IPaymentMethodRepository paymentMethodRepo)
    : IRequestHandler<RegisterSalePaymentCommand, SaleDto>
{
    public async Task<SaleDto> Handle(RegisterSalePaymentCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;

        // 1. Load primary sale with items and payments
        var sale = await saleRepo.GetByIdAsync(cmd.SaleId, ct)
            ?? throw new NotFoundException("Sale", cmd.SaleId);

        if (sale.TenantId != cmd.TenantId)
            throw new ForbiddenException("La venta no pertenece a este tenant.");

        if (sale.Status != SaleStatus.PendingPayment)
            throw new BadRequestException("La venta no está pendiente de pago.");

        if (!req.Payments.Any())
            throw new BadRequestException("Debe incluir al menos un método de pago.");

        // 2. Resolve payment methods and calculate total deductions
        var paymentDetails = new List<(int MethodId, string MethodName, decimal Amount, decimal DeductionPct)>();
        decimal totalDeductions = 0;
        foreach (var p in req.Payments)
        {
            var method = await paymentMethodRepo.GetByIdAsync(p.PaymentMethodId, ct)
                ?? throw new NotFoundException("PaymentMethod", p.PaymentMethodId);
            if (method.TenantId != cmd.TenantId)
                throw new ForbiddenException("Método de pago no pertenece a este tenant.");
            var deductionPct = method.HasDeduction ? method.DeductionPercent : 0m;
            paymentDetails.Add((method.Id, method.Name, p.Amount, deductionPct));
            if (method.HasDeduction)
                totalDeductions += Math.Round(p.Amount * deductionPct / 100, 2);
        }

        // 3. Recalculate stylist/salon totals using stored sale items
        var grossTotal = sale.GrossTotal; // GrossServices + GrossProducts + TipAmount
        var pct = grossTotal > 0 ? totalDeductions / grossTotal : 0m;

        decimal stylistCommServices = 0, salonCommServices = 0;
        decimal stylistCommProducts = 0, salonCommProducts = 0;

        foreach (var item in sale.Items)
        {
            var itemBase = item.UnitPrice * item.Quantity * (1 - pct);
            if (item.Type == SaleItemType.Service)
            {
                var svcCommPct = item.StylistCommissionPercent / 100m;
                if (item.SalonFeePercent > 0)
                {
                    var fee = Math.Round(itemBase * item.SalonFeePercent / 100, 2);
                    var remainder = itemBase - fee;
                    stylistCommServices += Math.Round(remainder * svcCommPct, 2);
                    salonCommServices   += Math.Round(remainder * (1 - svcCommPct), 2) + fee;
                }
                else
                {
                    stylistCommServices += Math.Round(itemBase * svcCommPct, 2);
                    salonCommServices   += Math.Round(itemBase * (1 - svcCommPct), 2);
                }
            }
            else if (item.Type == SaleItemType.ProductSale)
            {
                var prodCommPct = item.StylistCommissionPercent / 100m;
                stylistCommProducts += Math.Round(itemBase * prodCommPct, 2);
                salonCommProducts   += Math.Round(itemBase * (1 - prodCommPct), 2);
            }
            // ProductInternal: no commission adjustment needed (already stored)
        }

        var tipDeduction = grossTotal > 0 ? Math.Round(totalDeductions * sale.TipAmount / grossTotal, 2) : 0m;
        var netTip = Math.Round(sale.TipAmount - tipDeduction, 2);

        decimal newStylistTotal = Math.Round(stylistCommServices + stylistCommProducts + netTip, 2);
        decimal newSalonTotal   = Math.Round(salonCommServices   + salonCommProducts, 2);

        // 4. Apply payment and activate primary sale
        sale.RegisterPayment(totalDeductions, newStylistTotal, newSalonTotal);
        foreach (var (methodId, methodName, amount, deductionPct_) in paymentDetails)
            sale.Payments.Add(SalePayment.CreateForSale(sale, methodId, methodName, amount, deductionPct_));

        // 5. Activate sibling sales in the same ticket (multi-stylist)
        var siblings = await saleRepo.GetByTicketIdAsync(cmd.SaleId, ct);
        foreach (var sibling in siblings.Where(s => s.Id != sale.Id && s.Status == SaleStatus.PendingPayment))
            sibling.Activate();

        // 6. Persist
        await saleRepo.SaveChangesAsync(ct);

        return SaleDtoMapper.ToDto(sale, includeItems: true);
    }
}
