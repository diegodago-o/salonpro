using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetSalesQuery(int TenantId) : IRequest<IEnumerable<SaleDto>>;

public class GetSalesHandler(ISaleRepository repo)
    : IRequestHandler<GetSalesQuery, IEnumerable<SaleDto>>
{
    public async Task<IEnumerable<SaleDto>> Handle(GetSalesQuery query, CancellationToken ct)
    {
        var sales = await repo.GetTodayByTenantAsync(query.TenantId, ct);
        return sales.Select(s =>
        {
            var primaryPayment = s.Payments.FirstOrDefault();
            var paymentMethodName = primaryPayment?.PaymentMethodName ?? string.Empty;
            return new SaleDto(
                s.Id,
                s.SaleDateTime.ToString("o"),
                s.StylistName,
                s.ClientName,
                s.ClientDocument,
                paymentMethodName,
                s.GrossTotal,
                s.TotalDeductions,
                s.StylistTotal,
                s.SalonTotal,
                s.TipAmount,
                s.Status.ToString(),
                s.VoidedReason);
        });
    }
}
