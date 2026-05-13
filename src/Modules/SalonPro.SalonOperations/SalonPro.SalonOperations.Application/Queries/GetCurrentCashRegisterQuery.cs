using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetCurrentCashRegisterQuery(int TenantId, int BranchId) : IRequest<CashRegisterDto?>;

public class GetCurrentCashRegisterHandler(ICashRegisterRepository repo)
    : IRequestHandler<GetCurrentCashRegisterQuery, CashRegisterDto?>
{
    public async Task<CashRegisterDto?> Handle(GetCurrentCashRegisterQuery query, CancellationToken ct)
    {
        var cr = await repo.GetCurrentOpenByTenantAsync(query.TenantId, query.BranchId, ct);
        if (cr is null) return null;
        return MapToDto(cr);
    }

    internal static CashRegisterDto MapToDto(Domain.Entities.CashRegister cr) => new(
        cr.Id, cr.BranchId, cr.BranchName, cr.CashierId, cr.CashierName,
        cr.OpenedAt.ToString("o"),
        cr.ClosedAt?.ToString("o"),
        cr.OpeningBalance, cr.DeclaredCash, cr.ExpectedCash, cr.Difference,
        cr.Status.ToString(), cr.Notes,
        cr.Details.Select(d => new CashRegisterDetailDto(
            d.PaymentMethodId, d.PaymentMethodName, d.TotalAmount, d.TotalDeductions, d.NetAmount
        )).ToList());
}
