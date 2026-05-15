using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

// ── Helpers ──────────────────────────────────────────────────────────────────
public static class SaleDtoMapper
{
    public static SaleDto ToDto(Sale s, bool includeItems = false)
    {
        var primaryPayment = s.Payments.FirstOrDefault();
        var items = includeItems
            ? s.Items.Select(i => new SaleItemDto(
                i.Id, i.Type.ToString(), i.Name,
                i.UnitPrice, i.Quantity,
                Math.Round(i.UnitPrice * i.Quantity, 2),
                i.SalonFeePercent))
            : null;
        var payments = includeItems
            ? s.Payments.Select(p => new SalePaymentDto(
                p.PaymentMethodId, p.PaymentMethodName,
                p.Amount, p.DeductionPercent, p.DeductionAmount))
            : null;
        return new SaleDto(
            s.Id,
            s.SaleDateTime.ToString("o"),
            s.StylistId, s.StylistName, s.CommissionPercent,
            s.ClientName, s.ClientDocument,
            s.ClientDocumentType, s.ClientEmail, s.ClientPhone,
            s.BranchName,
            primaryPayment?.PaymentMethodName ?? string.Empty,
            s.GrossServices, s.GrossProducts, s.InternalConsumption,
            s.TipAmount, s.TotalDeductions, s.GrossTotal,
            s.StylistTotal, s.SalonTotal,
            s.Status.ToString(), s.VoidedReason, s.Notes,
            items, payments);
    }
}

// ── List query (today or date range) ─────────────────────────────────────────
public record GetSalesQuery(
    int TenantId,
    DateTime? From = null,
    DateTime? To = null,
    int? BranchId = null,
    string? BranchName = null) : IRequest<IEnumerable<SaleDto>>;

public class GetSalesHandler(ISaleRepository repo)
    : IRequestHandler<GetSalesQuery, IEnumerable<SaleDto>>
{
    public async Task<IEnumerable<SaleDto>> Handle(GetSalesQuery query, CancellationToken ct)
    {
        IEnumerable<Sale> sales;
        if (query.From.HasValue && query.To.HasValue)
            sales = await repo.GetByTenantAndDateRangeAsync(query.TenantId, query.From.Value, query.To.Value, query.BranchId, query.BranchName, ct);
        else
            sales = await repo.GetAllByTenantAsync(query.TenantId, query.BranchId, query.BranchName, ct);

        return sales.Select(s => SaleDtoMapper.ToDto(s));
    }
}

// ── Single detail query ───────────────────────────────────────────────────────
public record GetSaleDetailQuery(int TenantId, int SaleId) : IRequest<SaleDto>;

public class GetSaleDetailHandler(ISaleRepository repo)
    : IRequestHandler<GetSaleDetailQuery, SaleDto>
{
    public async Task<SaleDto> Handle(GetSaleDetailQuery query, CancellationToken ct)
    {
        var sale = await repo.GetByIdAsync(query.SaleId, ct)
            ?? throw new KeyNotFoundException($"Venta {query.SaleId} no encontrada.");
        if (sale.TenantId != query.TenantId) throw new UnauthorizedAccessException();
        return SaleDtoMapper.ToDto(sale, includeItems: true);
    }
}
