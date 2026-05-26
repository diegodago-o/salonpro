using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Enums;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetCurrentCashRegisterQuery(int TenantId, int BranchId) : IRequest<CashRegisterDto?>;

public class GetCurrentCashRegisterHandler(ICashRegisterRepository repo, ISaleRepository saleRepo)
    : IRequestHandler<GetCurrentCashRegisterQuery, CashRegisterDto?>
{
    public async Task<CashRegisterDto?> Handle(GetCurrentCashRegisterQuery query, CancellationToken ct)
    {
        var cr = await repo.GetCurrentOpenByTenantAsync(query.TenantId, query.BranchId, ct);
        if (cr is null) return null;

        // ── Desglose en vivo: leer ventas reales del turno ──────────────────
        // Excluye Voided; incluye Active y Settled (liquidadas durante el turno)
        var sales = await saleRepo.GetByCashRegisterAsync(cr.Id, ct);
        var validSales = sales.Where(s => s.Status != SaleStatus.Voided).ToList();

        var liveDetails = validSales
            .SelectMany(s => s.Payments)
            .GroupBy(p => new { p.PaymentMethodId, p.PaymentMethodName })
            .Select(g => new CashRegisterDetailDto(
                g.Key.PaymentMethodId,
                g.Key.PaymentMethodName,
                g.Sum(p => p.Amount),
                g.Sum(p => p.DeductionAmount),
                g.Sum(p => p.Amount) - g.Sum(p => p.DeductionAmount)))
            .OrderBy(d => d.PaymentMethodName)
            .ToList();

        return MapToDto(cr, liveDetails, validSales.Count);
    }

    /// <summary>
    /// Convierte la entidad CashRegister a DTO.
    /// <para>Para registros abiertos, pasar <paramref name="overrideDetails"/> con el desglose computado en vivo.</para>
    /// <para>Para registros cerrados (historial/detalle), omitir — usa los Details persistidos en BD.</para>
    /// </summary>
    internal static CashRegisterDto MapToDto(
        Domain.Entities.CashRegister cr,
        List<CashRegisterDetailDto>? overrideDetails = null,
        int saleCount = 0) => new(
            cr.Id, cr.BranchId, cr.BranchName, cr.CashierId, cr.CashierName,
            cr.OpenedAt.ToString("o"),
            cr.ClosedAt?.ToString("o"),
            cr.OpeningBalance, cr.DeclaredCash, cr.ExpectedCash, cr.Difference,
            cr.Status.ToString(), cr.Notes,
            overrideDetails ?? cr.Details.Select(d => new CashRegisterDetailDto(
                d.PaymentMethodId, d.PaymentMethodName, d.TotalAmount, d.TotalDeductions, d.NetAmount
            )).ToList(),
            saleCount);
}
